import * as React from 'react';
import { QuickStartContext, QuickStartContextValues } from '@patternfly/quickstarts';

type WithQuickStartContextProps = {
  quickStartContext: QuickStartContextValues;
};

export const withQuickStartContext = <Props extends WithQuickStartContextProps>(
  WrappedComponent: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithQuickStartContextProps>> => (props: Props) => {
  const quickStartContext = React.useContext(QuickStartContext);
  return <WrappedComponent {...props} quickStartContext={quickStartContext} />;
};
