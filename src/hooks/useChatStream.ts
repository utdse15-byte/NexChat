import { useState, useEffect } from 'react';
import { useChatStore } from '../domain/chat/chatStore';
import { useConfigStore } from '../domain/config/configStore';
import { chatRuntime } from '../core/runtime/chatRuntime';
import { buildContext } from '../core/context/buildContext';
import { getProvider } from '../core/providers';
import { streamChat } from '../core/transport/streamChat';

export function useChatStream() {
  const activeSessionId = useChatStore(state => state.activeSessionId);
  const createSession = useChatStore(state => state.createSession);
  const addMessage = useChatStore(state => state.addMessage);
  const updateMessageContent = useChatStore(state => state.updateMessageContent);
  const setMessageStatus = useChatStore(state => state.setMessageStatus);
  const setMessageError = useChatStore(state => state.setMessageError);
  const deleteMessage = useChatStore(state => state.deleteMessage);
  
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (activeSessionId) {
      setIsStreaming(chatRuntime.getActiveRequest(activeSessionId) !== undefined);
    } else {
      setIsStreaming(false);
    }

    return () => {
      if (activeSessionId) {
        chatRuntime.abortRequest(activeSessionId);
      }
    };
  }, [activeSessionId]);
  
  const sendMessage = async (content: string, overrideSessionId?: string) => {
    let sid = overrideSessionId || activeSessionId;
    if (!sid) {
      sid = createSession();
    }

    if (chatRuntime.getActiveRequest(sid)) {
      return;
    }

    const config = useConfigStore.getState();
    const { systemPrompt, maxContextRounds, firstByteTimeout, streamIdleTimeout } = config;

    // Use done immediately as per spec "pending is for assistant before first byte"
    addMessage(sid, { role: 'user', content, status: 'done' });
    const aiMsgId = addMessage(sid, { role: 'assistant', content: '', status: 'pending' });

    setIsStreaming(true);

    const sessionObj = useChatStore.getState().sessions[sid];
    const allMessages = sessionObj.messageIds.map(id => useChatStore.getState().messages[id]);
    // Skip the newly added assistant pending message for context building
    const contextMessages = buildContext(systemPrompt, content, allMessages.slice(0, -1), maxContextRounds);

    const abortController = new AbortController();
    const requestId = crypto.randomUUID();

    chatRuntime.registerRequest(sid, requestId, abortController, {
      requestId,
      sessionId: sid,
      assistantMessageId: aiMsgId,
      userMessageContent: content,
      config,
      contextMessages,
      createdAt: Date.now()
    });

    const verifyActive = () => {
      const activeReq = chatRuntime.getActiveRequest(sid);
      // Fallback: If no active request but we are checking the same assistantMessageId, it's a residual cleanup
      if (!activeReq) return true; 
      return activeReq && activeReq.requestId === requestId;
    };

    const handleTimeout = (type: 'firstByte' | 'idle') => {
      if (!verifyActive()) return;
      const errorMsg = type === 'firstByte' ? '请求首字节超时' : '流数据接收超时';
      abortController.abort(new Error(errorMsg));
      setMessageError(aiMsgId, {
        type: 'timeout',
        message: errorMsg,
        retryable: true
      });
      chatRuntime.cleanup(sid, aiMsgId);
      setIsStreaming(false);
    };

    chatRuntime.setFirstByteTimer(aiMsgId, firstByteTimeout, () => handleTimeout('firstByte'));

    const provider = getProvider('openai');

    await streamChat({
      provider,
      config,
      contextMessages,
      signal: abortController.signal,
      callbacks: {
        onDelta: (delta) => {
          if (!verifyActive()) return;
          chatRuntime.clearFirstByteTimer(aiMsgId);
          chatRuntime.setIdleTimer(aiMsgId, streamIdleTimeout, () => handleTimeout('idle'));
          
          const msg = useChatStore.getState().messages[aiMsgId];
          if (msg && msg.status === 'pending') {
            setMessageStatus(aiMsgId, 'streaming');
          }

          chatRuntime.appendBuffer(aiMsgId, delta);
          chatRuntime.scheduleFlush(aiMsgId, (bufferedContent) => {
            updateMessageContent(aiMsgId, bufferedContent);
          });
        },
        onDone: () => {
          if (!verifyActive()) return;
          const finalContent = chatRuntime.getBufferContent(aiMsgId);
          updateMessageContent(aiMsgId, finalContent);
          setMessageStatus(aiMsgId, 'done');
          chatRuntime.cleanup(sid, aiMsgId);
          setIsStreaming(false);
        },
        onError: (error) => {
          if (!verifyActive()) return;
          const finalContent = chatRuntime.getBufferContent(aiMsgId);
          updateMessageContent(aiMsgId, finalContent);
          setMessageError(aiMsgId, error);
          chatRuntime.cleanup(sid, aiMsgId);
          setIsStreaming(false);
        },
        onAbort: () => {
          if (!verifyActive()) return;
          const finalContent = chatRuntime.getBufferContent(aiMsgId);
          updateMessageContent(aiMsgId, finalContent);
          setMessageStatus(aiMsgId, 'aborted');
          chatRuntime.cleanup(sid, aiMsgId);
          setIsStreaming(false);
        }
      }
    });
  };

  const stopGeneration = () => {
    if (activeSessionId) {
      chatRuntime.abortRequest(activeSessionId);
      setIsStreaming(false);
    }
  };

  const retryMessage = (failedAssistantMessageId: string) => {
    const messagesObj = useChatStore.getState().messages;
    const sessionObj = useChatStore.getState().sessions[activeSessionId!];
    if (!sessionObj) return;

    const failedMsg = messagesObj[failedAssistantMessageId];
    if (!failedMsg || failedMsg.role !== 'assistant') return;

    const msgIds = sessionObj.messageIds;
    const failedIndex = msgIds.indexOf(failedAssistantMessageId);
    if (failedIndex <= 0) return;

    const prevUserMsgId = msgIds[failedIndex - 1];
    const prevUserMsg = messagesObj[prevUserMsgId];

    if (prevUserMsg && prevUserMsg.role === 'user') {
      deleteMessage(failedAssistantMessageId);
      sendMessage(prevUserMsg.content, activeSessionId!);
    }
  };

  return { sendMessage, stopGeneration, isStreaming, retryMessage };
}
