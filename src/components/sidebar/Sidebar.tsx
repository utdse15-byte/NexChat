import { Drawer, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useEffect, useState, useMemo } from 'react';
import { useChatStore } from '../../domain/chat/chatStore';
import { useUIStore } from '../../domain/ui/uiStore';
import { groupSessionsByTime } from '../../utils/time';
import SessionGroup from './SessionGroup';
import NewChatButton from './NewChatButton';

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [isMobile, setIsMobile] = useState(false);
  const setIsSettingsOpen = useUIStore(state => state.setIsSettingsOpen);
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
      <div className="p-4 border-t border-white/10 mt-auto shrink-0">
        <Button 
          type="text" 
          block 
          icon={<SettingOutlined />} 
          className="text-slate-400 hover:text-cyan-400 hover:bg-slate-800 flex items-center justify-start h-10 px-3"
          onClick={() => {
            setIsSettingsOpen(true);
            if (isMobile) onClose();
          }}
        >
          <span className="ml-2">设置</span>
        </Button>
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
