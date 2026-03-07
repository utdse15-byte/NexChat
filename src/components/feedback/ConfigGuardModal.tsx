import { Modal } from 'antd';

export default function ConfigGuardModal({
  open,
  onClose,
  onOpenSettings
}: {
  open: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <Modal
      title={<span className="text-slate-100">请先配置 API 参数</span>}
      open={open}
      onCancel={onClose}
      footer={[
        <button
          key="setting"
          onClick={() => {
            onClose();
            onOpenSettings();
          }}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg transition-colors font-medium border-none cursor-pointer"
        >
          前往设置
        </button>
      ]}
      className="dark-modal"
      classNames={{
        header: '!bg-slate-900 border-b border-white/10 pb-3',
        body: 'py-4',
        footer: 'border-t border-white/10 pt-3',
        mask: 'backdrop-blur-sm bg-black/50',
      }}
      closeIcon={<span className="text-slate-400 hover:text-slate-200 cursor-pointer text-lg font-light leading-none">×</span>}
    >
      <p className="text-slate-300">
        您需要配置 API Key、Base URL 和模型才能开始对话。目前仅支持兼容 OpenAI API 格式的服务。
      </p>
    </Modal>
  );
}
