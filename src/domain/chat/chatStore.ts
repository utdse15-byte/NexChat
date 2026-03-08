import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Session, Message, MessageStatus } from './types';
import { indexedDBStorage } from '../../core/storage/indexedDBStorage';
import { migrateChatData } from '../../core/storage/migration';
import { generateId } from '../../utils/id';
import { extractTitle } from './helpers';
import type { ChatError } from '../../core/errors/types';
import { chatRuntime } from '../../core/runtime/chatRuntime';

interface ChatStoreState {
  sessions: Record<string, Session>;
  messages: Record<string, Message>;
  sessionOrder: string[];
  activeSessionId: string | null;
  streamingContent: Record<string, string>;
}

interface ChatStoreActions {
  createSession: () => string;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;

  addMessage: (sessionId: string, msg: Pick<Message, 'role' | 'content' | 'status'>) => string;
  updateMessageContent: (messageId: string, content: string) => void;
  setMessageStatus: (messageId: string, status: MessageStatus) => void;
  setMessageError: (messageId: string, error: ChatError) => void;
  deleteMessage: (messageId: string) => void;

  cleanupStaleStates: () => void;
  clearAllData: () => void;
  setStreamingContent: (messageId: string, content: string) => void;
  finalizeStreamingContent: (messageId: string) => void;
}

type ChatStore = ChatStoreState & ChatStoreActions;

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      sessions: {},
      messages: {},
      sessionOrder: [],
      activeSessionId: null,
      streamingContent: {},

      createSession: () => {
        const id = generateId();
        const now = Date.now();
        const newSession: Session = {
          id,
          title: '新会话',
          messageIds: [],
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => {
          if (state.activeSessionId) {
            chatRuntime.abortRequest(state.activeSessionId, 'session_switch');
          }
          return {
            sessions: { ...state.sessions, [id]: newSession },
            sessionOrder: [id, ...state.sessionOrder],
            activeSessionId: id,
          };
        });
        
        return id;
      },

      switchSession: (id) => {
        set((state) => {
          if (state.activeSessionId && state.activeSessionId !== id) {
            chatRuntime.abortRequest(state.activeSessionId, 'session_switch');
          }
          return { activeSessionId: id };
        });
      },

      deleteSession: (id) => {
        chatRuntime.abortRequest(id, 'session_deleted');
        set((state) => {
          const newSessions = { ...state.sessions };
          const sessionToDelete = newSessions[id];
          if (!sessionToDelete) return state;

          const newMessages = { ...state.messages };
          sessionToDelete.messageIds.forEach(msgId => {
            delete newMessages[msgId];
          });

          delete newSessions[id];
          const newOrder = state.sessionOrder.filter(sId => sId !== id);
          
          let newActive = state.activeSessionId;
          if (newActive === id) {
            newActive = newOrder.length > 0 ? newOrder[0] : null;
          }

          return {
            sessions: newSessions,
            messages: newMessages,
            sessionOrder: newOrder,
            activeSessionId: newActive,
          };
        });
      },

      updateSessionTitle: (id, title) => {
        set((state) => {
          const session = state.sessions[id];
          if (!session) return state;
          return {
            sessions: {
              ...state.sessions,
              [id]: { ...session, title, updatedAt: Date.now() }
            }
          };
        });
      },

      addMessage: (sessionId, msg) => {
        const id = generateId();
        const now = Date.now();
        const newMessage: Message = {
          id,
          sessionId,
          ...msg,
          createdAt: now,
        };

        set((state) => {
          const session = state.sessions[sessionId];
          if (!session) return state;

          let newTitle = session.title;
          if (msg.role === 'user' && session.messageIds.length === 0) {
            newTitle = extractTitle(msg.content);
          }

          const updatedSession = {
            ...session,
            title: newTitle,
            messageIds: [...session.messageIds, id],
            updatedAt: now,
          };

          return {
            messages: { ...state.messages, [id]: newMessage },
            sessions: { ...state.sessions, [sessionId]: updatedSession },
            sessionOrder: [sessionId, ...state.sessionOrder.filter(sid => sid !== sessionId)]
          };
        });

        return id;
      },

      updateMessageContent: (messageId, content) => {
        set((state) => {
          const msg = state.messages[messageId];
          if (!msg) return state;
          return {
            messages: {
              ...state.messages,
              [messageId]: { ...msg, content }
            },
            // Also clear from streaming content if it existed
            streamingContent: { ...state.streamingContent, [messageId]: '' }
          };
        });
      },

      setStreamingContent: (messageId, content) => {
        set((state) => ({
          streamingContent: { ...state.streamingContent, [messageId]: content }
        }));
      },

      finalizeStreamingContent: (messageId) => {
        set((state) => {
          const content = state.streamingContent[messageId];
          const msg = state.messages[messageId];
          if (!msg || content === undefined) return state;

          const newStreamingContent = { ...state.streamingContent };
          delete newStreamingContent[messageId];

          return {
            messages: {
              ...state.messages,
              [messageId]: { ...msg, content }
            },
            streamingContent: newStreamingContent
          };
        });
      },

      setMessageStatus: (messageId, status) => {
        set((state) => {
          const msg = state.messages[messageId];
          if (!msg) return state;
          return {
            messages: {
              ...state.messages,
              [messageId]: { ...msg, status }
            }
          };
        });
      },

      setMessageError: (messageId, error) => {
        set((state) => {
          const msg = state.messages[messageId];
          if (!msg) return state;
          return {
            messages: {
              ...state.messages,
              [messageId]: { ...msg, status: 'error', error }
            }
          };
        });
      },

      deleteMessage: (messageId) => {
        set((state) => {
          const msg = state.messages[messageId];
          if (!msg) return state;
          
          const newMessages = { ...state.messages };
          delete newMessages[messageId];
          
          const session = state.sessions[msg.sessionId];
          let updatedSessions = state.sessions;
          
          if (session) {
            updatedSessions = {
              ...state.sessions,
              [session.id]: {
                ...session,
                messageIds: session.messageIds.filter(id => id !== messageId)
              }
            };
          }
          
          return {
            messages: newMessages,
            sessions: updatedSessions
          };
        });
      },

      cleanupStaleStates: () => {
        set((state) => {
          const newMessages = { ...state.messages };
          let changed = false;
          
          Object.values(newMessages).forEach(msg => {
            if (msg.status === 'pending') {
              newMessages[msg.id] = {
                ...msg,
                status: 'error',
                error: {
                  type: 'network_error',
                  message: '请求因页面刷新被中断',
                  retryable: true
                }
              };
              changed = true;
            } else if (msg.status === 'streaming') {
              newMessages[msg.id] = {
                ...msg,
                status: 'aborted'
              };
              changed = true;
            }
          });
          
          return changed ? { messages: newMessages } : state;
        });
      },

      clearAllData: () => {
        chatRuntime.abortAllRequests('session_deleted');
        set({
          sessions: {},
          messages: {},
          sessionOrder: [],
          activeSessionId: null
        });
      }
    }),
    {
      name: 'nexchat-data',
      version: 1,
      storage: createJSONStorage(() => indexedDBStorage),
      migrate: migrateChatData,
      partialize: (state) => ({
        sessions: state.sessions,
        messages: state.messages,
        sessionOrder: state.sessionOrder,
        activeSessionId: state.activeSessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.cleanupStaleStates();
        }
      }
    }
  )
);
