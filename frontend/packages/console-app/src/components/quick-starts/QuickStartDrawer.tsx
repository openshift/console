import type { ReactNode } from 'react';
import { QuickStartDrawer as PfQuickStartDrawer } from '@patternfly/quickstarts';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { QuickStartsLoader } from './loader/QuickStartsLoader';
import './QuickStartDrawer.scss';

interface QuickStartDrawerProps {
  children?: ReactNode;
}

export const QuickStartDrawer: React.FCC<QuickStartDrawerProps> = ({ children, ...props }) => (
  <QuickStartsLoader>
    {(quickStarts, loaded) =>
      loaded ? (
        <PfQuickStartDrawer quickStarts={quickStarts} {...props} className="co-quick-start-drawer">
          {children}
        </PfQuickStartDrawer>
      ) : (
        <LoadingBox blame="QuickStartDrawer" />
      )
    }
  </QuickStartsLoader>
);
