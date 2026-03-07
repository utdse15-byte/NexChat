import { describe, it, expect } from 'vitest';
import { createSSEParser, extractDataFromEvent } from './sseParser';

describe('SSE Parser', () => {
  it('should parse a complete event', () => {
    const { parse } = createSSEParser();
    const events = parse('data: {"test":1}\n\n');
    expect(events).toEqual(['data: {"test":1}']);
  });

  it('should parse multiple events at once', () => {
    const { parse } = createSSEParser();
    const events = parse('data: 1\n\ndata: 2\n\n');
    expect(events).toEqual(['data: 1', 'data: 2']);
  });

  it('should handle fragmented packets across chunks', () => {
    const { parse, getRest } = createSSEParser();
    const e1 = parse('data: {"te');
    expect(e1).toEqual([]);
    expect(getRest()).toBe('data: {"te');
    
    const e2 = parse('st":1}\n\n');
    expect(e2).toEqual(['data: {"test":1}']);
    expect(getRest()).toBe('');
  });

  it('should separate half line newline correctly', () => {
    const { parse } = createSSEParser();
    const e1 = parse('data: 1\r\n\r');
    expect(e1).toEqual(['data: 1']);
    const e2 = parse('\n');
    expect(e2).toEqual([]);
  });

  it('should ignore empty events', () => {
    const { parse } = createSSEParser();
    const events = parse('\n\n\n\n');
    expect(events).toEqual([]);
  });

  it('should extract data payload', () => {
    const data = extractDataFromEvent('data: {"test":1}');
    expect(data).toEqual(['{"test":1}']);
  });

  it('should extract data with multiple data lines', () => {
    const data = extractDataFromEvent('data: abc\ndata: def');
    expect(data).toEqual(['abc', 'def']);
  });
  
  it('should ignore comments', () => {
    const data = extractDataFromEvent(': ping\ndata: true');
    expect(data).toEqual(['true']);
  });

  it('should handle data line without space', () => {
    const data = extractDataFromEvent('data:{"test":1}');
    expect(data).toEqual(['{"test":1}']);
  });

  it('should handle [DONE] signal', () => {
    const data = extractDataFromEvent('data: [DONE]');
    expect(data).toEqual(['[DONE]']);
  });
});
