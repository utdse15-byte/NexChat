import type { Session } from '../domain/chat/types';

export function getRelativeTime(timestamp: number): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return new Date(timestamp).toLocaleDateString();
}

export function groupSessionsByTime(sessions: Session[]): Record<string, Session[]> {
  const groups: Record<string, Session[]> = {
    '今天': [],
    '昨天': [],
    '过去 7 天': [],
    '更早': [],
  };
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const weekAgo = today - 7 * 86400000;

  sessions.forEach((session) => {
    if (session.updatedAt >= today) {
      groups['今天'].push(session);
    } else if (session.updatedAt >= yesterday) {
      groups['昨天'].push(session);
    } else if (session.updatedAt >= weekAgo) {
      groups['过去 7 天'].push(session);
    } else {
      groups['更早'].push(session);
    }
  });

  return groups;
}
