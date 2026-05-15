import { describe, it, expect } from 'vitest';
import { buildContext } from './buildContext';
import type { Message } from '../../domain/chat/types';

describe('buildContext', () => {
  it('should ignore history when maxContextRounds is 0', () => {
    const systemPrompt = 'You are a helpful assistant.';
    const userContent = 'Hello, AI!';
    const history: Message[] = [
      { id: '1', sessionId: 's1', role: 'user', content: 'What is 1+1?', status: 'done', createdAt: 0 },
      { id: '2', sessionId: 's1', role: 'assistant', content: 'It is 2.', status: 'done', createdAt: 1 }
    ];

    const context = buildContext(systemPrompt, userContent, history, 0);

    expect(context.length).toBe(2);
    expect(context[0]).toEqual({ role: 'system', content: 'You are a helpful assistant.' });
    expect(context[1]).toEqual({ role: 'user', content: 'Hello, AI!' });
  });

  it('should include history when maxContextRounds is greater than 0', () => {
    const systemPrompt = 'You are a helpful assistant.';
    const userContent = 'Hello, AI!';
    const history: Message[] = [
      { id: '1', sessionId: 's1', role: 'user', content: 'What is 1+1?', status: 'done', createdAt: 0 },
      { id: '2', sessionId: 's1', role: 'assistant', content: 'It is 2.', status: 'done', createdAt: 1 }
    ];

    const context = buildContext(systemPrompt, userContent, history, 1);

    expect(context.length).toBe(4);
    expect(context[0]).toEqual({ role: 'system', content: 'You are a helpful assistant.' });
    expect(context[1]).toEqual({ role: 'user', content: 'What is 1+1?' });
    expect(context[2]).toEqual({ role: 'assistant', content: 'It is 2.' });
    expect(context[3]).toEqual({ role: 'user', content: 'Hello, AI!' });
  });
});
