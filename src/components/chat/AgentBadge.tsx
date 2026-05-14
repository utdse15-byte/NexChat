/**
 * Agent 类型标签
 * 在 AI 消息上方显示当前使用的 Agent 类型
 */

const AGENT_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  chat:    { label: '对话',   color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',  icon: '💬' },
  rag:     { label: '知识库', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20', icon: '📚' },
  summary: { label: '总结',   color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: '📝' },
};

export default function AgentBadge({ agentType }: { agentType?: string }) {
  if (!agentType) return null;

  const config = AGENT_CONFIG[agentType];
  if (!config) return null;

  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${config.color} font-medium`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
