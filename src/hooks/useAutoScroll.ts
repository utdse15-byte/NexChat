import { useState, useEffect, useCallback, type RefObject } from 'react';
import { chatRuntime } from '../core/runtime/chatRuntime';

export function useAutoScroll(scrollRef: RefObject<HTMLElement | null>) {
  const [isLocked, setIsLocked] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      if (chatRuntime.isProgrammaticScroll()) return;
      
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceToBottom = scrollHeight - scrollTop - clientHeight;
      setIsLocked(distanceToBottom <= 80);
    };

    let rafId: number;
    const throttledScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleScroll);
    };

    el.addEventListener('scroll', throttledScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', throttledScroll);
      cancelAnimationFrame(rafId);
    };
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      if (isLocked) {
        chatRuntime.setProgrammaticScroll(true);
        el.scrollTop = el.scrollHeight;
        requestAnimationFrame(() => chatRuntime.setProgrammaticScroll(false));
      }
    });

    if (el.firstElementChild) {
      observer.observe(el.firstElementChild);
    }
    observer.observe(el);

    return () => observer.disconnect();
  }, [scrollRef, isLocked]);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      chatRuntime.setProgrammaticScroll(true);
      el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
      requestAnimationFrame(() => chatRuntime.setProgrammaticScroll(false));
      setIsLocked(true);
    }
  }, [scrollRef]);

  return { isLocked, scrollToBottom };
}
