import * as React from 'react';
import * as _ from 'lodash-es';

const useDeepCompareMemoize = (dependencies?: readonly any[], deepCompareDependencies?: readonly any[]) => {
  const ref = React.useRef({basic: dependencies, deep: deepCompareDependencies});

  if (deepCompareDependencies && !_.isEqual(deepCompareDependencies, ref.current.deep)) {
    ref.current.deep = deepCompareDependencies;
  }

  if (dependencies && !dependencies.every((dep, index) => ref.current.basic[index] === dep)) {
    ref.current.basic = dependencies;
  }

  return ref.current;
};

export const useEffectDeepCompare = (
  callback: React.EffectCallback,
  dependencies?: readonly any[],
  deepCompareDependencies?: readonly any[],
) => {
  const { basic, deep } = useDeepCompareMemoize(dependencies, deepCompareDependencies);
  React.useEffect(callback, [basic, deep]);
};
