import { useSyncExternalStore } from 'react';
import { useChatStore } from '../domain/chat/chatStore';
import { useConfigStore } from '../domain/config/configStore';
import { chatRuntime } from '../core/runtime/chatRuntime';
import { buildContext } from '../core/context/buildContext';
import { getProvider } from '../core/providers';
import { streamChat } from '../core/transport/streamChat';

/**
 * 订阅 chatRuntime 的当前会话流式状态。
 * 用 useSyncExternalStore 而非 useEffect+useState，避免在 effect 内同步 setState 导致级联渲染。
 */
function useIsStreaming(sessionId: string | null): boolean {
  return useSyncExternalStore(
    (onChange) => chatRuntime.subscribe(onChange),
    () => (sessionId ? chatRuntime.getActiveRequest(sessionId) !== undefined : false),
    () => false
  );
}

export function useChatStream() {
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const createSession = useChatStore((state) => state.createSession);
  const addMessage = useChatStore((state) => state.addMessage);
  const setStreamingContent = useChatStore((state) => state.setStreamingContent);
  const finalizeStreamingContent = useChatStore((state) => state.finalizeStreamingContent);
  const setMessageStatus = useChatStore((state) => state.setMessageStatus);
  const setMessageError = useChatStore((state) => state.setMessageError);
  const setMessageWarning = useChatStore((state) => state.setMessageWarning);
  const setMessageMetadata = useChatStore((state) => state.setMessageMetadata);
  const deleteMessage = useChatStore((state) => state.deleteMessage);

  const isStreaming = useIsStreaming(activeSessionId);

  const sendMessage = async (content: string, overrideSessionId?: string) => {
    let sid = overrideSessionId || activeSessionId;
    if (!sid) {
      sid = createSession();
    }

    if (chatRuntime.getActiveRequest(sid)) {
      return;
    }

    const userMsgId = addMessage(sid, { role: 'user', content, status: 'done' });
    return runChatRequest(content, sid, userMsgId);
  };

  /**
   * 仅创建 assistant pending 消息并发起请求。
   * @param userContent 用户消息文本
   * @param sid 会话 ID
   * @param userMsgId 当前用户消息 ID（用于从历史中排除，避免 buildContext 重复追加）
   */
  const runChatRequest = async (userContent: string, sid: string, userMsgId: string) => {
    const config = useConfigStore.getState();
    const { systemPrompt, maxContextRounds, maxContextTokens, firstByteTimeout, streamIdleTimeout } = config;

    const aiMsgId = addMessage(sid, { role: 'assistant', content: '', status: 'pending' });

    // 从最新 state 取消息列表，排除当前 user 消息和 assistant pending 消息
    // buildContext 会自行将 userContent 作为最后一条 user 消息追加
    const sessionObj = useChatStore.getState().sessions[sid];
    const historyMessages = sessionObj.messageIds
      .filter((id) => id !== userMsgId && id !== aiMsgId)
      .map((id) => useChatStore.getState().messages[id])
      .filter(Boolean);

    const contextMessages = buildContext(
      systemPrompt,
      userContent,
      historyMessages,
      maxContextRounds,
      maxContextTokens
    );

    const abortController = new AbortController();
    const requestId = crypto.randomUUID();

    chatRuntime.registerRequest(sid, requestId, abortController, {
      requestId,
      sessionId: sid,
      assistantMessageId: aiMsgId,
      userMessageContent: userContent,
      config,
      contextMessages,
      createdAt: Date.now(),
    });

    let isSettled = false;
    let timeoutHandled = false;

    const verifyActive = (isTerminal = false) => {
      if (isSettled) return false;

      const activeReq = chatRuntime.getActiveRequest(sid!);
      if (activeReq && activeReq.requestId !== requestId) {
        return false;
      }

      if (isTerminal) {
        isSettled = true;
      } else if (!activeReq) {
        return false;
      }

      return true;
    };

    const handleTimeout = (type: 'firstByte' | 'idle') => {
      if (!verifyActive(true)) return;
      timeoutHandled = true;
      const errorMsg = type === 'firstByte' ? '请求首字节超时' : '流数据接收超时';
      abortController.abort(new Error(errorMsg));
      // 即便超时，也要保留已接收的部分内容
      chatRuntime.flushBuffer(aiMsgId, (bufferedContent) => {
        setStreamingContent(aiMsgId, bufferedContent);
      });
      finalizeStreamingContent(aiMsgId);
      setMessageError(aiMsgId, {
        type: 'timeout',
        message: errorMsg,
        retryable: true,
      });
      chatRuntime.cleanup(sid!, aiMsgId);
    };

    chatRuntime.setFirstByteTimer(aiMsgId, firstByteTimeout, () => handleTimeout('firstByte'));

    const provider = config.backendEnabled ? getProvider('backend') : getProvider(config.provider);

    /**
     * 终态前的统一收尾：先把 chatRuntime 缓冲区中尚未刷新的内容
     * 强制写入 streamingContent，再 finalize 持久化到 messages[id].content。
     * 修复因 rAF flush 异步性导致的尾部内容丢失。
     */
    const flushAndFinalize = () => {
      chatRuntime.flushBuffer(aiMsgId, (bufferedContent) => {
        setStreamingContent(aiMsgId, bufferedContent);
      });
      finalizeStreamingContent(aiMsgId);
    };

    await streamChat({
      provider,
      config,
      contextMessages,
      signal: abortController.signal,
      extras: { sessionId: sid },
      callbacks: {
        onDelta: (delta) => {
          if (!verifyActive(false)) return;
          chatRuntime.clearFirstByteTimer(aiMsgId);
          chatRuntime.setIdleTimer(aiMsgId, streamIdleTimeout, () => handleTimeout('idle'));

          const msg = useChatStore.getState().messages[aiMsgId];
          if (msg && msg.status === 'pending') {
            setMessageStatus(aiMsgId, 'streaming');
          }

          chatRuntime.appendBuffer(aiMsgId, delta);
          chatRuntime.scheduleFlush(aiMsgId, (bufferedContent) => {
            setStreamingContent(aiMsgId, bufferedContent);
          });
        },
        onMetadata: (metadata) => {
          if (!verifyActive(false)) return;
          // metadata 是后端在路由分类完成后的首个事件，
          // 视为"已收到首字节"以避免前端在路由 LLM 慢时误判首字节超时。
          chatRuntime.clearFirstByteTimer(aiMsgId);
          chatRuntime.setIdleTimer(aiMsgId, streamIdleTimeout, () => handleTimeout('idle'));
          if (metadata.agent_type) {
            setMessageMetadata(aiMsgId, { agentType: metadata.agent_type });
          }
        },
        onSources: (sources) => {
          if (!verifyActive(false)) return;
          if (Array.isArray(sources) && sources.length > 0) {
            setMessageMetadata(aiMsgId, { sources });
          }
        },
        onDone: (finishReason) => {
          if (!verifyActive(true)) return;
          flushAndFinalize();

          if (finishReason === 'length') {
            // length 截断：保持 done 状态，附加非阻塞 warning 提示
            setMessageStatus(aiMsgId, 'done');
            setMessageWarning(aiMsgId, {
              type: 'protocol_error',
              message: '回复因 token 上限被截断，可尝试减少上下文轮数或增大 max_tokens 设置。',
              retryable: false,
            });
          } else {
            setMessageStatus(aiMsgId, 'done');
          }

          chatRuntime.cleanup(sid!, aiMsgId);
        },
        onError: (error) => {
          if (!verifyActive(true)) return;
          flushAndFinalize();
          setMessageError(aiMsgId, error);
          chatRuntime.cleanup(sid!, aiMsgId);
        },
        onAbort: () => {
          if (timeoutHandled) return;
          if (!verifyActive(true)) return;
          flushAndFinalize();

          const reason = abortController.signal.reason;
          if (reason === 'user_stop') {
            setMessageStatus(aiMsgId, 'aborted');
          } else if (reason === 'session_switch' || reason === 'session_deleted') {
            setMessageStatus(aiMsgId, 'aborted');
          } else {
            setMessageError(aiMsgId, {
              type: 'network_error',
              message: '由于页面重载或组件销毁，请求被中止',
              retryable: true,
            });
          }

          chatRuntime.cleanup(sid!, aiMsgId);
        },
        onRetry: (_attempt, _delay) => {
          if (!verifyActive(false)) return;
          setMessageStatus(aiMsgId, 'reconnecting');
        },
      },
    });
  };

  const stopGeneration = () => {
    if (activeSessionId) {
      chatRuntime.abortRequest(activeSessionId, 'user_stop');
    }
  };

  const retryMessage = (failedAssistantMessageId: string) => {
    const messagesObj = useChatStore.getState().messages;
    const sid = activeSessionId;
    if (!sid) return;
    const sessionObj = useChatStore.getState().sessions[sid];
    if (!sessionObj) return;

    const failedMsg = messagesObj[failedAssistantMessageId];
    if (!failedMsg || failedMsg.role !== 'assistant') return;

    const msgIds = sessionObj.messageIds;
    const failedIndex = msgIds.indexOf(failedAssistantMessageId);
    if (failedIndex <= 0) return;

    const prevUserMsgId = msgIds[failedIndex - 1];
    const prevUserMsg = messagesObj[prevUserMsgId];
    if (!prevUserMsg || prevUserMsg.role !== 'user') return;

    if (chatRuntime.getActiveRequest(sid)) return;

    // 仅删除失败的 assistant 消息，复用现有 user 消息发起请求
    deleteMessage(failedAssistantMessageId);
    runChatRequest(prevUserMsg.content, sid, prevUserMsgId);
  };

  return { sendMessage, stopGeneration, isStreaming, retryMessage };
}
