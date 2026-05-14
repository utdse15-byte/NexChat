import { Drawer } from 'antd';
import ApiConfigSection from './ApiConfigSection';
import ModelConfigSection from './ModelConfigSection';
import BackendConfigSection from './BackendConfigSection';
import DangerZone from './DangerZone';

export default function SettingsDrawer({ open, onClose }: { open: boolean, onClose: () => void }) {
  return (
    <Drawer
      title={<span className="text-slate-100 font-medium">全局设置</span>}
      placement="right"
      onClose={onClose}
      open={open}
      width={360}
      className="dark-drawer"
      classNames={{
        header: '!bg-slate-900 border-b border-white/10 pb-3',
        body: '!bg-slate-900 !text-slate-300 py-4 custom-scrollbar',
        mask: 'backdrop-blur-sm bg-black/50',
      }}
      closeIcon={<span className="text-slate-400 hover:text-slate-200 text-lg sm:text-2xl font-light cursor-pointer leading-none">×</span>}
    >
      <div className="space-y-8 pb-8">
        <ApiConfigSection />
        <div className="h-px bg-white/5 w-full"></div>
        <ModelConfigSection />
        <div className="h-px bg-white/5 w-full"></div>
        <BackendConfigSection />
        <div className="h-px bg-white/5 w-full"></div>
        <DangerZone />
      </div>
    </Drawer>
  );
}

