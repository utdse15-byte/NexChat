export function sanitizeMarkdown(raw: string): string {
  let text = raw;
  const backtickOccurrences = (text.match(/```/g) || []).length;
  if (backtickOccurrences % 2 !== 0) {
    text += '\n```';
  }
  return text;
}
