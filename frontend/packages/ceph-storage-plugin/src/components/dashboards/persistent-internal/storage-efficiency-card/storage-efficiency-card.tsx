import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { PrometheusResponse } from '@console/internal/components/graphs';

import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { POOL_STORAGE_EFFICIENCY_QUERIES, StorageDashboardQuery } from '../../../../queries';
import { EfficiencyItemBody } from '../../common/storage-efficiency/storage-efficiency-card-item';
import { getGaugeValue } from '../../../../utils';

const StorageEfficiencyCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const { t } = useTranslation();

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
    return t('ceph-storage-plugin~{{capacityRatio, number}}:1', {
      capacityRatio: Math.round(capacityRatio),
    });
  };

  const savingStats = () => {
    const savingsValue = Number(saved);
    const savedBytes = humanizeBinaryBytes(savingsValue).string;
    return savedBytes;
  };

  const compressionRatioProps = {
    stats: Number(ratio),
    isLoading: !poolCapacityRatioResult && !poolCapacityRatioResultError,
    error: !!poolCapacityRatioResultError || !ratio,
    title: t('ceph-storage-plugin~Compression ratio'),
    infoText: t(
      'ceph-storage-plugin~The Compression Ratio represents the compressible data effectiveness metric inclusive of all compression-enabled pools.',
    ),
    getStats: compressionStats,
  };

  const savingsProps = {
    stats: Number(saved),
    isLoading: !poolSavedResult && !poolSavedResultError,
    error: !!poolSavedResultError || !saved,
    title: t('ceph-storage-plugin~Savings'),
    infoText: t(
      'ceph-storage-plugin~The Savings metric represents the actual disk capacity saved inclusive of all compression-enabled pools and associated replicas.',
    ),
    getStats: savingStats,
  };

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Storage Efficiency')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody className="co-dashboard-card__body--no-padding">
        <EfficiencyItemBody {...compressionRatioProps} />
        <EfficiencyItemBody {...savingsProps} />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(StorageEfficiencyCard);
