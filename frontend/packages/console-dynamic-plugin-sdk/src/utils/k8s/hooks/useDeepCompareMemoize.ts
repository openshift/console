import { useRef } from 'react';
import * as _ from 'lodash';

export const useDeepCompareMemoize = <T = any>(value: T, stringify?: boolean): T => {
  const ref = useRef<T>(undefined);

  // eslint-disable-next-line react-hooks-js/refs -- custom memoization: reads the previous value during render so the returned reference stays stable across deep-equal inputs; a state-based rewrite would loop forever for values that never compare deep-equal (e.g. URLSearchParams or fresh closures), which this hook intentionally tolerates as a passthrough
  const prev = ref.current;
  if (stringify ? JSON.stringify(value) !== JSON.stringify(prev) : !_.isEqual(value, prev)) {
    // eslint-disable-next-line react-hooks-js/refs -- custom memoization: adopts the new value during render so consumers see it in the same pass
    ref.current = value;
  }

  // eslint-disable-next-line react-hooks-js/refs -- custom memoization: returns the stable reference during render
  return ref.current;
};
