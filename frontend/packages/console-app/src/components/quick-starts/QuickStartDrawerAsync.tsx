import * as React from 'react';
import type { ReactNode } from 'react';
import { AsyncComponent } from '@console/internal/components/utils';

interface QuickStartDrawerAsyncProps {
  children?: ReactNode;
}

const QuickStartDrawerAsync: React.FCC<QuickStartDrawerAsyncProps> = ({ children, ...props }) => (
  <AsyncComponent
    loader={() =>
      import('./QuickStartDrawer' /* webpackChunkName: "quick-start" */).then((c) => c.default)
    }
    {...props}
  >
    {children}
  </AsyncComponent>
);

export default QuickStartDrawerAsync;
