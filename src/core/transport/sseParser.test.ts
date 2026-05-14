import { describe, it, expect } from 'vitest';
import { createSSEParser, parseEventText } from './sseParser';

describe('SSE Parser', () => {
  it('parses a complete event', () => {
    const { parse } = createSSEParser();
    const events = parse('data: {"test":1}\n\n');
    expect(events).toEqual([{ data: '{"test":1}' }]);
  });

  it('parses multiple events at once', () => {
    const { parse } = createSSEParser();
    const events = parse('data: 1\n\ndata: 2\n\n');
    expect(events).toEqual([{ data: '1' }, { data: '2' }]);
  });

  it('handles fragmented packets across chunks', () => {
    const { parse, getRest } = createSSEParser();
    const e1 = parse('data: {"te');
    expect(e1).toEqual([]);
    expect(getRest()).toBe('data: {"te');

    const e2 = parse('st":1}\n\n');
    expect(e2).toEqual([{ data: '{"test":1}' }]);
    expect(getRest()).toBe('');
  });

  it('separates half-line newline correctly', () => {
    const { parse } = createSSEParser();
    const e1 = parse('data: 1\r\n\r');
    expect(e1).toEqual([{ data: '1' }]);
    const e2 = parse('\n');
    expect(e2).toEqual([]);
  });

  it('ignores empty events', () => {
    const { parse } = createSSEParser();
    const events = parse('\n\n\n\n');
    expect(events).toEqual([]);
  });

  it('parses custom event types', () => {
    const { parse } = createSSEParser();
    const events = parse('event: metadata\ndata: {"agent_type":"rag"}\n\n');
    expect(events).toEqual([{ event: 'metadata', data: '{"agent_type":"rag"}' }]);
  });

  it('parses sources event', () => {
    const { parse } = createSSEParser();
    const events = parse('event: sources\ndata: [{"id":1}]\n\n');
    expect(events).toEqual([{ event: 'sources', data: '[{"id":1}]' }]);
  });

  it('extracts data with multiple data lines', () => {
    const result = parseEventText('data: abc\ndata: def');
    expect(result).toEqual({ data: 'abc\ndef' });
  });

  it('ignores comments', () => {
    const result = parseEventText(': ping\ndata: true');
    expect(result).toEqual({ data: 'true' });
  });

  it('handles data line without space', () => {
    const result = parseEventText('data:{"test":1}');
    expect(result).toEqual({ data: '{"test":1}' });
  });

  it('handles [DONE] signal', () => {
    const result = parseEventText('data: [DONE]');
    expect(result).toEqual({ data: '[DONE]' });
  });

  it('returns null when no data field', () => {
    const result = parseEventText(': heartbeat');
    expect(result).toBeNull();
  });
});
