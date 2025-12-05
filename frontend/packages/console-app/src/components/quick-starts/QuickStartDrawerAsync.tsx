import type { ReactNode } from 'react';
import { AsyncComponent } from '@console/internal/components/utils/async';

interface QuickStartDrawerAsyncProps {
  children?: ReactNode;
}

export const QuickStartDrawerAsync: React.FCC<QuickStartDrawerAsyncProps> = ({
  children,
  ...props
}) => (
  <AsyncComponent
    loader={() =>
      import('./QuickStartDrawer' /* webpackChunkName: "quick-start" */).then(
        (c) => c.QuickStartDrawer,
      )
    }
    {...props}
  >
    {children}
  </AsyncComponent>
);
