import * as React from 'react';

const useCombineRefs = <RefType extends any>(
  ...refs: (React.Ref<RefType> | undefined)[]
): ((instance: RefType | null) => void) =>
  React.useCallback(
    (element: RefType): void =>
      refs.forEach((ref) => {
        if (ref) {
          if (typeof ref === 'function') {
            ref(element);
          } else {
            (ref as React.MutableRefObject<any>).current = element;
          }
        }
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    refs,
  );

export default useCombineRefs;
