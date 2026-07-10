import { useEffect, useRef } from 'react';

// Slightly modified from Dan Abramov's blog post about using React hooks for polling
// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export const usePoll = (callback, delay, ...dependencies) => {
  const savedCallback = useRef(null);
  const jitterRef = useRef(delay ? Math.floor(Math.random() * delay * 0.2) : 0);

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    const tick = () => savedCallback.current();

    tick(); // Run first tick immediately.

    if (delay) {
      const id = setInterval(tick, delay + jitterRef.current);
      return () => clearInterval(id);
    }
    return () => {};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...dependencies]);
};
