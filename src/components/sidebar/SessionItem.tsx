import { MessageOutlined, DeleteOutlined } from '@ant-design/icons';
import { Popconfirm } from 'antd';
import type { Session } from '../../domain/chat/types';
import { useChatStore } from '../../domain/chat/chatStore';
import { chatRuntime } from '../../core/runtime/chatRuntime';

export default function SessionItem({ session }: { session: Session }) {
  const activeSessionId = useChatStore(state => state.activeSessionId);
  const switchSession = useChatStore(state => state.switchSession);
  const deleteSession = useChatStore(state => state.deleteSession);
  
  const isActive = activeSessionId === session.id;

  return (
    <div 
      onClick={() => switchSession(session.id)}
      className={`group flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive ? 'bg-slate-800 text-cyan-400' : 'hover:bg-slate-800 text-slate-300'
      }`}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <MessageOutlined className={isActive ? 'text-cyan-400' : 'text-slate-500'} />
        <span className="truncate text-sm font-medium">{session.title}</span>
      </div>
      
      <div onClick={e => e.stopPropagation()}>
        <Popconfirm
          title="删除对话"
          description="确定要删除这个对话吗？"
          onConfirm={() => {
            if (isActive) {
              chatRuntime.abortRequest(session.id);
            }
            deleteSession(session.id);
          }}
          okText="删除"
          cancelText="取消"
          overlayClassName="dark-popconfirm"
        >
          <button className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer">
            <DeleteOutlined />
          </button>
        </Popconfirm>
      </div>
    </div>
  );
}
