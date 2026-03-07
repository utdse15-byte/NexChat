import { MenuOutlined, SettingOutlined } from '@ant-design/icons';
import { useUIStore } from '../../domain/ui/uiStore';

export default function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const setIsSettingsOpen = useUIStore(state => state.setIsSettingsOpen);
  
  return (
    <header className="flex-none flex items-center justify-between h-14 px-4 border-b border-white/10 lg:hidden shrink-0">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <MenuOutlined className="text-slate-300 text-lg" />
        </button>
        <h1 className="ml-2 font-semibold text-slate-100">NexChat</h1>
      </div>
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="p-2 -mr-2 rounded-md hover:bg-slate-800 transition-colors text-slate-400 hover:text-cyan-400 cursor-pointer"
      >
        <SettingOutlined className="text-xl" />
      </button>
    </header>
  );
}
