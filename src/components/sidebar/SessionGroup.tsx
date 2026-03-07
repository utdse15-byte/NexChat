import type { Session } from '../../domain/chat/types';
import SessionItem from './SessionItem';

export default function SessionGroup({ title, sessions }: { title: string, sessions: Session[] }) {
  if (sessions.length === 0) return null;
  return (
    <div className="mb-4">
      <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</div>
      <div className="px-2 space-y-1">
        {sessions.map(s => (
          <SessionItem key={s.id} session={s} />
        ))}
      </div>
    </div>
  );
}
