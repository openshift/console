import * as React from 'react';
import QuickStartsLoader from '@console/app/src/components/quick-starts/loader/QuickStartsLoader';
import { ClusterDashboard } from './cluster-dashboard';

const ClusterDashboardWithQuickStarts: React.FC<{}> = () => (
  <QuickStartsLoader>
    {(quickStarts) => <ClusterDashboard quickStarts={quickStarts} />}
  </QuickStartsLoader>
);

export default ClusterDashboardWithQuickStarts;
