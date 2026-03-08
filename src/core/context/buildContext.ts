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
  
  let currentTokens = calculateMessageTokens([
    ...(systemMsg ? [systemMsg] : []),
    currentMsg
  ]);

  // 2. Filter valid history messages (chronological order)
  const validHistory = sessionMessages.filter(m => 
    m.content.trim() !== '' && 
    m.status !== 'pending'
  );

  // 3. Select history messages from latest to oldest (Sliding Window)
  const selectedHistory: Message[] = [];
  let roundsCount = 0;

  for (let i = validHistory.length - 1; i >= 0; i--) {
    const msg = validHistory[i];
    
    // Check rounds limit if applicable
    if (maxContextRounds > 0 && msg.role === 'user') {
      if (roundsCount >= maxContextRounds) break;
      roundsCount++;
    }

    const msgTokens = estimateTokens(msg.content) + 4; // content + overhead
    
    if (currentTokens + msgTokens > maxContextTokens) {
      break; // Optimization: stop if we hit the token limit
    }

    currentTokens += msgTokens;
    selectedHistory.unshift(msg);
  }

  // 4. Assemble final context
  if (systemMsg) context.push(systemMsg);
  
  for (const msg of selectedHistory) {
    context.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
  }

  context.push(currentMsg);

  return context;
}
