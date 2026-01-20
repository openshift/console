import type { FC, ReactNode } from 'react';
import { QuickStartDrawer as PfQuickStartDrawer } from '@patternfly/quickstarts';
import { QuickStartsLoader } from './loader/QuickStartsLoader';
import './QuickStartDrawer.scss';

interface QuickStartDrawerProps {
  children?: ReactNode;
}

export const QuickStartDrawer: FC<QuickStartDrawerProps> = ({ children }) => (
  <QuickStartsLoader>
    {(quickStarts) => (
      <PfQuickStartDrawer quickStarts={quickStarts} className="co-quick-start-drawer">
        {children}
      </PfQuickStartDrawer>
    )}
  </QuickStartsLoader>
);
