import { useSyncExternalStore } from 'react';

const TICK_INTERVAL = 10000;

let tick = Date.now();
let intervalId: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function subscribe(callback: () => void): () => void {
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
}

function getSnapshot(): number {
  return tick;
}

export function useTimestampTick(): number {
  return useSyncExternalStore(subscribe, getSnapshot);
}
