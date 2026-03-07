export function extractTitle(content: string): string {
  const text = content.trim();
  if (!text) return '新会话';
  const title = text.slice(0, 30);
  return title.length < text.length ? title + '...' : title;
}
