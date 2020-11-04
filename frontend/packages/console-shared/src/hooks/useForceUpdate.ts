import * as React from 'react';

export const useForceUpdate = () => {
  const [, setTick] = React.useState(0);
  const update = React.useCallback(() => {
    setTick((tick) => tick + 1);
  }, []);
  return update;
};
