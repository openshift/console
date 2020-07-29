import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { PrometheusResponse } from '@console/internal/components/graphs';

import {
  POOL_STORAGE_EFFICIENCY_QUERIES,
  StorageDashboardQuery,
} from '../../../../constants/queries';
import { EfficiencyItemBody } from './storage-efficiency-card-item';
import { getGaugeValue } from '../../../../utils';

import './storage-efficiency-card.scss';
import { humanizeBinaryBytes } from '@console/internal/components/utils';

const StorageEfficiencyCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  React.useEffect(() => {
    Object.keys(POOL_STORAGE_EFFICIENCY_QUERIES).forEach((key) =>
      watchPrometheus(POOL_STORAGE_EFFICIENCY_QUERIES[key]),
    );
    return () =>
      Object.keys(POOL_STORAGE_EFFICIENCY_QUERIES).forEach((key) =>
        stopWatchPrometheusQuery(POOL_STORAGE_EFFICIENCY_QUERIES[key]),
      );
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const poolCapacityRatioResult = prometheusResults.getIn([
    POOL_STORAGE_EFFICIENCY_QUERIES[StorageDashboardQuery.POOL_CAPACITY_RATIO],
    'data',
  ]) as PrometheusResponse;

  const poolCapacityRatioResultError = prometheusResults.getIn([
    POOL_STORAGE_EFFICIENCY_QUERIES[StorageDashboardQuery.POOL_CAPACITY_RATIO],
    'loadError',
  ]);

  const poolSavedResult = prometheusResults.getIn([
    POOL_STORAGE_EFFICIENCY_QUERIES[StorageDashboardQuery.POOL_SAVED_CAPACITY],
    'data',
  ]) as PrometheusResponse;

  const poolSavedResultError = prometheusResults.getIn([
    POOL_STORAGE_EFFICIENCY_QUERIES[StorageDashboardQuery.POOL_SAVED_CAPACITY],
    'loadError',
  ]);

  const ratio = getGaugeValue(poolCapacityRatioResult);
  const saved = getGaugeValue(poolSavedResult);

  const compressionStats = () => {
    const capacityRatio = Number(ratio);
    return capacityRatio === 0 ? '1:1' : `${Math.round(capacityRatio)}:1`;
  };

  const savingStats = () => {
    const savingsValue = Number(saved);
    const savedBytes = humanizeBinaryBytes(savingsValue).string;
    return savingsValue === 0 ? 'No Savings' : savedBytes;
  };

  const compressionRatioProps = {
    isLoading: !poolCapacityRatioResult,
    error: !!poolCapacityRatioResultError || !ratio,
    title: 'Compression ratio',
    infoText:
      'The ratio of the data physical stored (after compression), compared to the size of the data received from the client.',
    getStats: compressionStats,
  };

  const savingsProps = {
    isLoading: !poolSavedResult,
    error: !!poolSavedResultError || !saved,
    title: 'Savings',
    infoText: 'The amount of physical storage saved after applying compression.',
    getStats: savingStats,
  };

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Storage Efficiency</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody className="co-dashboard-card__body--no-padding">
        <EfficiencyItemBody {...compressionRatioProps} />
        <EfficiencyItemBody {...savingsProps} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(StorageEfficiencyCard);
