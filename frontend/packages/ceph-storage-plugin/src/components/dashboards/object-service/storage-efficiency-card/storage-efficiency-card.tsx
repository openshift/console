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
import { humanizeBinaryBytes, humanizePercentage } from '@console/internal/components/utils';
import { EfficiencyItemBody } from '../../common/storage-efficiency/storage-efficiency-card-item';
import { getGaugeValue } from '../../../../utils';
import { ObjectStorageEfficiencyQueries } from '../../../../queries/object-storage-queries';

const StorageEfficiencyCard: React.FC<DashboardItemProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const { t } = useTranslation();

  React.useEffect(() => {
    Object.keys(ObjectStorageEfficiencyQueries).forEach((key) =>
      watchPrometheus(ObjectStorageEfficiencyQueries[key]),
    );
    return () =>
      Object.keys(ObjectStorageEfficiencyQueries).forEach((key) =>
        stopWatchPrometheusQuery(ObjectStorageEfficiencyQueries[key]),
      );
  }, [watchPrometheus, stopWatchPrometheusQuery]);

  const compressionQueryResult = prometheusResults.getIn([
    ObjectStorageEfficiencyQueries.COMPRESSION_RATIO,
    'data',
  ]) as PrometheusResponse;
  const compressionQueryResultError = prometheusResults.getIn([
    ObjectStorageEfficiencyQueries.COMPRESSION_RATIO,
    'loadError',
  ]);

  const savingsQueryResult = prometheusResults.getIn([
    ObjectStorageEfficiencyQueries.SAVINGS_QUERY,
    'data',
  ]) as PrometheusResponse;
  const savingsQueryResultError = prometheusResults.getIn([
    ObjectStorageEfficiencyQueries.SAVINGS_QUERY,
    'loadError',
  ]);

  const logicalSavingsQueryResult = prometheusResults.getIn([
    ObjectStorageEfficiencyQueries.LOGICAL_SAVINGS_QUERY,
    'data',
  ]) as PrometheusResponse;
  const logicalSavingsQueryResultError = prometheusResults.getIn([
    ObjectStorageEfficiencyQueries.LOGICAL_SAVINGS_QUERY,
    'loadError',
  ]);

  const compressionRatio = getGaugeValue(compressionQueryResult);
  const savings = getGaugeValue(savingsQueryResult);
  const logicalSize = getGaugeValue(logicalSavingsQueryResult);

  const compressionStats = () => {
    const capacityRatio = Number(compressionRatio);
    return t('ceph-storage-plugin~{{capacityRatio, number}}:1', {
      capacityRatio: Math.round(capacityRatio),
    });
  };

  const savingStats = () => {
    const savedBytes = humanizeBinaryBytes(Number(savings)).string;
    const savingsPercentage = `${savedBytes} (${
      humanizePercentage((100 * Number(savings)) / Number(logicalSize)).string
    })`;
    return savingsPercentage;
  };

  const compressionRatioProps = {
    stats: Number(compressionRatio),
    isLoading: !compressionQueryResult && !compressionQueryResultError,
    error: !!compressionQueryResultError || !compressionRatio || Number(compressionRatio) === 1,
    title: t('ceph-storage-plugin~Compression ratio'),
    infoText: t(
      'ceph-storage-plugin~OpenShift Data Foundation can be configured to use compression. The efficiency rate reflects the actual compression ratio when using such a configuration.',
    ),
    getStats: compressionStats,
  };

  const savingsProps = {
    stats: Number(savings),
    isLoading: !savingsQueryResult && !logicalSavingsQueryResult && !savingsQueryResultError,
    error:
      !!savingsQueryResultError || !!logicalSavingsQueryResultError || !savings || !logicalSize,
    title: t('ceph-storage-plugin~Savings'),
    infoText: t(
      'ceph-storage-plugin~Savings shows the uncompressed and non-deduped data that would have been stored without those techniques.',
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
