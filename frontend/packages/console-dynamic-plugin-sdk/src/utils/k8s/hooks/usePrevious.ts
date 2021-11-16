import * as React from 'react';

export const usePrevious = <P = any>(value: P, deps?: any[]): P => {
  const ref = React.useRef<P>();
  React.useEffect(() => {
    ref.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps || [value]);
  return ref.current;
};
