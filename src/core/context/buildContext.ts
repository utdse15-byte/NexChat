import type { Message } from '../../domain/chat/types';
import { calculateMessageTokens, estimateTokens } from './tokenizer';

export function buildContext(
  systemPrompt: string,
  userContent: string,
  sessionMessages: Message[],
  maxContextRounds: number,
  maxContextTokens: number = 4000 // Default safety limit
): Array<{ role: 'system' | 'user' | 'assistant', content: string }> {
  const context: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];
  
  // 1. Calculate fixed tokens (system prompt + current user input)
  const systemMsg = systemPrompt.trim() ? { role: 'system' as const, content: systemPrompt.trim() } : null;
  const currentMsg = { role: 'user' as const, content: userContent };
  
  if (maxContextRounds <= 0) {
    if (systemMsg) context.push(systemMsg);
    context.push(currentMsg);
    return context;
  }

  let currentTokens = calculateMessageTokens([
    ...(systemMsg ? [systemMsg] : []),
    currentMsg
  ]);

  // 2. Filter valid history messages (chronological order)
  // Exclude messages that are incomplete or failed
  const excludedStatuses = new Set(['pending', 'streaming', 'error', 'aborted', 'reconnecting']);
  const validHistory = sessionMessages.filter(m => 
    m.content.trim() !== '' && 
    !excludedStatuses.has(m.status)
  );

  // 3. Select history messages by rounds first
  let startIndex = 0;
  if (maxContextRounds > 0) {
    let userRounds = 0;
    for (let i = validHistory.length - 1; i >= 0; i--) {
      if (validHistory[i].role === 'user') {
        userRounds++;
        if (userRounds === maxContextRounds) {
          startIndex = i;
          break;
        }
      }
    }
  }

  // Apply token limit from latest to oldest
  const selectedHistory: Message[] = [];
  for (let i = validHistory.length - 1; i >= startIndex; i--) {
    const msg = validHistory[i];
    const msgTokens = estimateTokens(msg.content) + 4; // content + overhead
    
    if (currentTokens + msgTokens > maxContextTokens) {
      break; // Optimization: stop if we hit the token limit
    }

    currentTokens += msgTokens;
    selectedHistory.unshift(msg);
  }

  // Remove dangling assistant messages from the top
  while (selectedHistory.length > 0 && selectedHistory[0].role === 'assistant') {
    selectedHistory.shift();
  }

  // 4. Assemble final context
  if (systemMsg) context.push(systemMsg);
  
  for (const msg of selectedHistory) {
    context.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
  }

  context.push(currentMsg);

  return context;
}
