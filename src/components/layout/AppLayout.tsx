import { useState } from 'react';
import AppHeader from './AppHeader';
import Sidebar from '../sidebar/Sidebar';
import ChatArea from '../chat/ChatArea';
import SettingsDrawer from '../settings/SettingsDrawer';
import { useUIStore } from '../../domain/ui/uiStore';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isSettingsOpen, setIsSettingsOpen } = useUIStore();

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 relative">
        <AppHeader onMenuClick={() => setSidebarOpen(true)} />
        <ChatArea />
      </div>

      <SettingsDrawer open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </div>
  );
}
