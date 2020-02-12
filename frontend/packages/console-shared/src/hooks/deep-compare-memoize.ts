import * as React from 'react';
import * as _ from 'lodash';

export const useDeepCompareMemoize = <T = any>(value: T): T => {
  const ref = React.useRef<T>();

  if (!_.isEqual(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
};
