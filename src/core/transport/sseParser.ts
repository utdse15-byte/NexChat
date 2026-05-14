/**
 * SSE 解析器
 *
 * 按 \n\n 切分事件块，解析每个事件的 `event:` / `data:` 字段。
 * 返回结构化 `SSEEvent[]`，调用方可根据 `event` 字段分发处理。
 *
 * 兼容 OpenAI 标准 SSE（仅 data:）和 NexChat 后端的自定义事件
 * （`event: metadata` 携带 Agent 元信息，`event: sources` 携带 RAG 引用来源）。
 */

export interface SSEEvent {
  /** 自定义事件名，未指定时为 undefined（视为默认 message 事件） */
  event?: string;
  /** 多行 data 拼接后的字符串 */
  data: string;
}

export function createSSEParser() {
  let buffer = '';

  const parse = (chunk: string): SSEEvent[] => {
    buffer += chunk;
    const events: SSEEvent[] = [];

    // 统一换行符
    buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const eventText = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (eventText) {
        const parsed = parseEventText(eventText);
        if (parsed) events.push(parsed);
      }

      boundary = buffer.indexOf('\n\n');
    }

    return events;
  };

  const getRest = () => buffer;

  return { parse, getRest };
}

/**
 * 解析单个事件块文本。返回 null 表示无 data 字段（如纯注释/心跳）。
 */
export function parseEventText(eventText: string): SSEEvent | null {
  const lines = eventText.split('\n');
  let event: string | undefined;
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith(':')) continue; // SSE 注释 / 心跳
    if (line.startsWith('id:')) continue;
    if (line.startsWith('retry:')) continue;

    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data: ')) {
      dataLines.push(line.slice(6));
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5));
    }
  }

  if (dataLines.length === 0) return null;
  return { event, data: dataLines.join('\n') };
}
