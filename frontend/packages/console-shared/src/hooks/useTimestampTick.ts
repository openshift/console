import { useSyncExternalStore } from 'react';

const TICK_INTERVAL = 10000;

let tick = Date.now();
let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

const subscribe = (callback: () => void): (() => void) => {
  listeners.add(callback);
  if (listeners.size === 1) {
    tick = Date.now();
    intervalId = setInterval(() => {
      tick = Date.now();
      listeners.forEach((cb) => cb());
    }, TICK_INTERVAL);
  }
  return () => {
    listeners.delete(callback);
    if (listeners.size === 0) {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  };
};

const getSnapshot = (): number => tick;

/**
 * Returns the current epoch timestamp (ms) that updates every 10 seconds.
 * Uses a single shared interval across all consumers — the interval starts on
 * first mount and stops when the last consumer unmounts.
 */
export const useTimestampTick = (): number => useSyncExternalStore(subscribe, getSnapshot);
