export interface RequestSnapshot {
  requestId: string;
  sessionId: string;
  assistantMessageId: string;
  userMessageContent: string;
  config: any;
  contextMessages: Array<{ role: string; content: string }>;
  createdAt: number;
}

export interface ActiveRequest {
  requestId: string;
  abortController: AbortController;
  snapshot: RequestSnapshot;
}

class ChatRuntime {
  private activeRequests = new Map<string, ActiveRequest>();
  private streamBuffers = new Map<string, { raw: string; lastFlushedLength: number }>();
  private firstByteTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private idleTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private rafHandles = new Map<string, number>();
  private programmaticScrollFlag = false;

  registerRequest(sessionId: string, requestId: string, abortController: AbortController, snapshot: RequestSnapshot) {
    this.activeRequests.set(sessionId, { requestId, abortController, snapshot });
    this.streamBuffers.set(snapshot.assistantMessageId, { raw: '', lastFlushedLength: 0 });
  }

  getActiveRequest(sessionId: string): ActiveRequest | undefined {
    return this.activeRequests.get(sessionId);
  }

  abortRequest(sessionId: string) {
    const req = this.activeRequests.get(sessionId);
    if (req) {
      req.abortController.abort();
      this.activeRequests.delete(sessionId);
    }
  }

  abortAllRequests() {
    for (const req of this.activeRequests.values()) {
      req.abortController.abort();
    }
    this.activeRequests.clear();
  }

  appendBuffer(messageId: string, delta: string) {
    const buf = this.streamBuffers.get(messageId);
    if (buf) {
      buf.raw += delta;
    }
  }

  getBufferContent(messageId: string): string {
    return this.streamBuffers.get(messageId)?.raw || '';
  }

  scheduleFlush(messageId: string, flushFn: (content: string, lastFlushed: number) => void) {
    if (this.rafHandles.has(messageId)) return;
    
    const id = requestAnimationFrame(() => {
      this.rafHandles.delete(messageId);
      const buf = this.streamBuffers.get(messageId);
      if (buf && buf.raw.length > buf.lastFlushedLength) {
        flushFn(buf.raw, buf.lastFlushedLength);
        buf.lastFlushedLength = buf.raw.length;
      }
    });
    this.rafHandles.set(messageId, id);
  }

  clearBuffer(messageId: string) {
    this.streamBuffers.delete(messageId);
  }

  setFirstByteTimer(messageId: string, timeoutMs: number, onTimeout: () => void) {
    this.clearFirstByteTimer(messageId);
    this.firstByteTimers.set(messageId, setTimeout(onTimeout, timeoutMs));
  }

  clearFirstByteTimer(messageId: string) {
    const timer = this.firstByteTimers.get(messageId);
    if (timer) {
      clearTimeout(timer);
      this.firstByteTimers.delete(messageId);
    }
  }

  setIdleTimer(messageId: string, timeoutMs: number, onTimeout: () => void) {
    this.clearIdleTimer(messageId);
    this.idleTimers.set(messageId, setTimeout(onTimeout, timeoutMs));
  }

  clearIdleTimer(messageId: string) {
    const timer = this.idleTimers.get(messageId);
    if (timer) {
      clearTimeout(timer);
      this.idleTimers.delete(messageId);
    }
  }

  setProgrammaticScroll(value: boolean) {
    this.programmaticScrollFlag = value;
  }

  isProgrammaticScroll(): boolean {
    return this.programmaticScrollFlag;
  }

  cleanup(sessionId: string, messageId: string) {
    this.clearFirstByteTimer(messageId);
    this.clearIdleTimer(messageId);
    const rafId = this.rafHandles.get(messageId);
    if (rafId) cancelAnimationFrame(rafId);
    this.rafHandles.delete(messageId);
    this.clearBuffer(messageId);
    
    const activeReq = this.activeRequests.get(sessionId);
    if (activeReq && activeReq.snapshot.assistantMessageId === messageId) {
      this.activeRequests.delete(sessionId);
    }
  }
}

export const chatRuntime = new ChatRuntime();
