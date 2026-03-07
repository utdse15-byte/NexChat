import type { Message } from '../../domain/chat/types';

export function buildContext(
  systemPrompt: string,
  userContent: string,
  sessionMessages: Message[],
  maxContextRounds: number
): Array<{ role: 'system' | 'user' | 'assistant', content: string }> {
  const context: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [];
  
  if (systemPrompt.trim()) {
    context.push({ role: 'system', content: systemPrompt.trim() });
  }

  const validMessages = sessionMessages.filter(m => 
    m.content.trim() !== '' && 
    m.status !== 'pending'
  );

  const rounds: Array<Message[]> = [];
  let currentRound: Message[] = [];
  
  for (const m of validMessages) {
    if (m.role === 'user') {
      if (currentRound.length > 0) {
        rounds.push([...currentRound]);
      }
      currentRound = [m];
    } else if (m.role === 'assistant') {
      currentRound.push(m);
      rounds.push([...currentRound]);
      currentRound = [];
    }
  }
  
  const roundsToInclude = rounds.slice(-maxContextRounds);
  
  for (const round of roundsToInclude) {
    for (const msg of round) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        context.push({ role: msg.role, content: msg.content });
      }
    }
  }

  context.push({ role: 'user', content: userContent });

  return context;
}
