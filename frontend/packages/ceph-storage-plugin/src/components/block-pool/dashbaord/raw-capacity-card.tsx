import * as React from 'react';
import { compose } from 'redux';
import { useTranslation } from 'react-i18next';

import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { usePrometheusQueries } from '@console/shared/src/components/dashboard/utilization-card/prometheus-hook';

import { BlockPoolDashboardContext } from './block-pool-dashboard-context';
import { getPoolQuery, StorageDashboardQuery } from '../../../queries/ceph-queries';
import { CapacityCard } from '../../dashboards/persistent-internal/raw-capacity-card/capacity-card';

const parser = compose((val) => val?.[0]?.y, getInstantVectorStats);

export const RawCapacityCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);
  const { name } = obj.metadata;

  // Metrics
  const queries = React.useMemo(
    () => [
      getPoolQuery([name], StorageDashboardQuery.POOL_RAW_CAPACITY_USED),
      getPoolQuery([name], StorageDashboardQuery.POOL_MAX_CAPACITY_AVAILABLE),
    ],
    [name],
  );
  const [values, loading, loadError] = usePrometheusQueries(queries, parser as any);

  const usedCapacityMetric = (values?.[0] ?? 0) as number;
  const availableCapacityMetric = (values?.[1] ?? 0) as number;
  const totalCapacityMetric = usedCapacityMetric + availableCapacityMetric;
  const description = t(
    'ceph-storage-plugin~Raw capacity is the absolute total disk space available to the array subsystem',
  );

  const props = {
    totalCapacityMetric,
    usedCapacityMetric,
    availableCapacityMetric,
    description,
    loading,
    loadError,
  };

  return <CapacityCard {...props} />;
};
