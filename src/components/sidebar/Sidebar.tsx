import { Drawer } from 'antd';
import { useEffect, useState, useMemo } from 'react';
import { useChatStore } from '../../domain/chat/chatStore';
import { groupSessionsByTime } from '../../utils/time';
import SessionGroup from './SessionGroup';
import NewChatButton from './NewChatButton';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isMobile, setIsMobile] = useState(false);
  const sessionsMap = useChatStore(state => state.sessions);
  const sessionOrder = useChatStore(state => state.sessionOrder);

  const groups = useMemo(() => {
    const sortedSessions = sessionOrder.map(id => sessionsMap[id]).filter(Boolean);
    return groupSessionsByTime(sortedSessions);
  }, [sessionsMap, sessionOrder]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const content = (
    <div className="flex flex-col h-full bg-slate-900 border-r border-white/10 w-[260px] text-slate-50">
      <div className="p-4">
        <NewChatButton onClick={() => isMobile && onClose()} />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
        {Object.entries(groups).map(([title, sessions]) => (
          <SessionGroup key={title} title={title} sessions={sessions} />
        ))}
        {sessionOrder.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-slate-500">
            暂无对话历史
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div className="hidden lg:block h-full shrink-0">
        {content}
      </div>

      {isMobile && (
        <div className="lg:hidden text-slate-50">
          <Drawer
            placement="left"
            open={isOpen}
            onClose={onClose}
            closable={false}
            width={260}
            styles={{ body: { padding: 0 } }}
            className="bg-slate-900!"
          >
            {content}
          </Drawer>
        </div>
      )}
    </>
  );
}
