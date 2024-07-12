import * as React from 'react';
import { QuickStartContextValues } from '@patternfly/quickstarts';
import { useQuickStartContext } from '../hooks/useQuickStartContext';

type WithQuickStartContextProps = {
  quickStartContext: QuickStartContextValues;
};

export const withQuickStartContext = <Props extends WithQuickStartContextProps>(
  WrappedComponent: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithQuickStartContextProps>> => {
  const Component = (props: Props) => {
    const quickStartContext = useQuickStartContext();
    return <WrappedComponent {...props} quickStartContext={quickStartContext} />;
  };
  Component.displayName = `withQuickStartContext(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;
  return Component;
};
