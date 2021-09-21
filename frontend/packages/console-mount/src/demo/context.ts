import * as React from 'react';

type ContextTestType = {
  value?: any;
  setValue?: () => void;
};

export const ContextTest = React.createContext<ContextTestType>({});
export const ContextTestProvider = ContextTest.Provider;

export const useContextTestHook = () => {
  const [value, setValue] = React.useState<any>(null);

  // eslint-disable-next-line no-console
  console.debug('useContextTestHook', value);

  return { value, setValue };
};
