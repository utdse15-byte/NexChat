import { Popconfirm } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useChatStore } from '../../domain/chat/chatStore';
import { useConfigStore } from '../../domain/config/configStore';

export default function DangerZone() {
  const clearAllChats = useChatStore(state => state.clearAllData);
  const resetConfig = useConfigStore(state => state.resetConfig);

  const handleClearData = () => {
    clearAllChats();
    resetConfig();
    window.location.reload();
  };

  return (
    <section className="space-y-4 pt-2">
      <h3 className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-4">危险操作</h3>
      
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <h4 className="text-sm font-medium text-red-400 mb-1">清除所有数据</h4>
        <p className="text-xs text-slate-400 mb-4">
          此操作将删除所有本地存储的对话记录、配置信息（包括 API Key）。数据删除后无法恢复。
        </p>
        
        <Popconfirm
          title="警告：确定清除所有数据？"
          description={<div className="max-w-xs text-slate-300 text-xs mt-1">这会永久删除您的所有聊天记录、设置以及相关的所有配置。此操作无法撤销。</div>}
          onConfirm={handleClearData}
          okText="确认清除"
          okButtonProps={{ danger: true }}
          cancelText="取消"
          overlayClassName="dark-popconfirm"
        >
          <button className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer w-full justify-center border-none">
            <DeleteOutlined /> 清除全部数据并重置
          </button>
        </Popconfirm>
      </div>
    </section>
  );
}
