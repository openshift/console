import * as React from 'react';
import * as _ from 'lodash';

export const useDeepCompareMemoize = <T = any>(value: T, strinfigy?: boolean): T => {
  const ref = React.useRef<T>();

  if (
    strinfigy
      ? JSON.stringify(value) !== JSON.stringify(ref.current)
      : !_.isEqual(value, ref.current)
  ) {
    ref.current = value;
  }

  return ref.current;
};
