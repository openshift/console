import * as React from 'react';
import type { ReactNode } from 'react';
import { QuickStartDrawer as PfQuickStartDrawer } from '@patternfly/quickstarts';
import { LoadingBox } from '@console/internal/components/utils';
import QuickStartsLoader from './loader/QuickStartsLoader';
import './QuickStartDrawer.scss';

interface QuickStartDrawerProps {
  children?: ReactNode;
}

const QuickStartDrawer: React.FCC<QuickStartDrawerProps> = ({ children, ...props }) => (
  <QuickStartsLoader>
    {(quickStarts, loaded) =>
      loaded ? (
        <PfQuickStartDrawer quickStarts={quickStarts} {...props} className="co-quick-start-drawer">
          {children}
        </PfQuickStartDrawer>
      ) : (
        <LoadingBox />
      )
    }
  </QuickStartsLoader>
);

export default QuickStartDrawer;
