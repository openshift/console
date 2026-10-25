import { useRef, useEffect } from 'react';

export const usePrevious = <P = any>(value: P, deps?: any[]): P => {
  const ref = useRef<P>(undefined);
  useEffect(
    () => {
      ref.current = value;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    deps || [value],
  );
  return ref.current;
};
