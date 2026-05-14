import { encode } from 'gpt-tokenizer';

/**
 * Estimates the number of tokens in a string.
 * Uses gpt-tokenizer for OpenAI-compatible encoding.
 * Fallback to a simple heuristic if encoding fails or for non-OpenAI models.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  
  try {
    // encode 返回 token id 数组
    return encode(text).length;
  } catch {
    // 兜底启发式：英文 ~4 字符/token，CJK ~1 字符/token
    const cjkRegex = /[\u4e00-\u9fa5\u3040-\u30ff\uac00-\ud7af]/g;
    const cjkCount = (text.match(cjkRegex) || []).length;
    const otherCount = text.length - cjkCount;
    return cjkCount + Math.ceil(otherCount / 4);
  }
}

/**
 * Calculates total tokens for a set of messages.
 * Includes overhead per message as per OpenAI's documentation.
 */
export function calculateMessageTokens(messages: Array<{ role: string, content: string }>): number {
  let total = 0;
  for (const msg of messages) {
    total += 4; // overhead per message
    total += estimateTokens(msg.content);
    total += estimateTokens(msg.role);
  }
  total += 3; // overhead for assistant reply trigger
  return total;
}
