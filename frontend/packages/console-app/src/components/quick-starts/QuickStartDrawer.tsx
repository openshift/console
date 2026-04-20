import * as React from 'react';
import { QuickStartDrawer as PfQuickStartDrawer } from '@patternfly/quickstarts';
import QuickStartsLoader from './loader/QuickStartsLoader';
import './QuickStartDrawer.scss';

interface QuickStartDrawerProps {
  children?: React.ReactNode;
}

export const QuickStartDrawer: React.FCC<QuickStartDrawerProps> = ({ children }) => (
  <QuickStartsLoader>
    {(quickStarts) => (
      <PfQuickStartDrawer quickStarts={quickStarts} className="co-quick-start-drawer">
        {children}
      </PfQuickStartDrawer>
    )}
  </QuickStartsLoader>
);

export default QuickStartDrawer;
