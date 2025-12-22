import type { Ref, MutableRefObject } from 'react';
import { useCallback } from 'react';

export const useCombineRefs = <RefType extends any>(...refs: (Ref<RefType> | undefined)[]) =>
  useCallback(
    (element: RefType | null): void =>
      refs.forEach((ref) => {
        if (ref) {
          if (typeof ref === 'function') {
            ref(element);
          } else {
            (ref as MutableRefObject<any>).current = element;
          }
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs,
  );
