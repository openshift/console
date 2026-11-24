import { useRef, useEffect } from 'react';

export const usePrevious = <P = any>(value: P, deps?: any[]): P => {
  const ref = useRef<P>(undefined);
  useEffect(
    () => {
      ref.current = value;
    },
    // eslint-disable-next-line react-hooks-js/exhaustive-deps
    deps || [value],
  );
  // eslint-disable-next-line react-hooks-js/refs -- usePrevious pattern: intentionally returns the value committed by the previous render's effect; a state-based rewrite would report the last *changed* value instead of the previous render's value, changing behavior for consumers that compare prev !== current
  return ref.current;
};
