import * as React from 'react';
import { QuickStartDrawer as PfQuickStartDrawer } from '@patternfly/quickstarts';
import { LoadingBox } from '@console/internal/components/utils';
import QuickStartsLoader from './loader/QuickStartsLoader';

const QuickStartDrawer: React.FC = ({ children, ...props }) => (
  <QuickStartsLoader>
    {(quickStarts, loaded) =>
      loaded ? (
        <PfQuickStartDrawer quickStarts={quickStarts} {...props}>
          {children}
        </PfQuickStartDrawer>
      ) : (
        <LoadingBox />
      )
    }
  </QuickStartsLoader>
);

export default QuickStartDrawer;
