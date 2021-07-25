import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { compose } from 'redux';

import { getInstantVectorStats } from '@console/internal/components/graphs/utils';

import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DetailItem from '@console/shared/src/components/dashboard/details-card/DetailItem';
import DetailsBody from '@console/shared/src/components/dashboard/details-card/DetailsBody';
import { usePrometheusQueries } from '@console/shared/src/components/dashboard/utilization-card/prometheus-hook';
import {
  humanizePercentage,
  humanizeBinaryBytes,
  humanizeNumber,
} from '@console/internal/components/utils';

import { BlockPoolDashboardContext } from './block-pool-dashboard-context';
import { EfficiencyItemBody } from '../common/storage-efficiency/storage-efficiency-card-item';

import { getPoolQuery, StorageDashboardQuery } from '../../../queries/ceph-queries';

const parser = compose((val) => val?.[0]?.y, getInstantVectorStats);

export const CompressionDetailsCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(BlockPoolDashboardContext);

  const compressionMode = obj.spec?.compressionMode;
  const compressionEnabled = compressionMode !== 'none';
  const { name } = obj.metadata;

  // Compression Metrics
  const queries = React.useMemo(
    () => [
      getPoolQuery([name], StorageDashboardQuery.POOL_COMPRESSION_SAVINGS),
      getPoolQuery([name], StorageDashboardQuery.POOL_COMPRESSION_ELIGIBILITY),
      getPoolQuery([name], StorageDashboardQuery.POOL_COMPRESSION_RATIO),
    ],
    [name],
  );

  const [values, loading, loadError] = usePrometheusQueries(queries, parser as any);
  const poolCompressionSavings = values?.[0];
  const poolCompressionEligibility = values?.[1];
  const poolCompressionRatio = values?.[2];

  const compressionEligibilityProps = {
    stats: Number(poolCompressionEligibility),
    isLoading: loading,
    error: loadError || !poolCompressionEligibility,
    title: t('ceph-storage-plugin~Compression eligibility'),
    getStats: () => humanizePercentage(poolCompressionEligibility).string,
    infoText: t(
      'ceph-storage-plugin~Compression eligibility indicates the percentage of incoming data that is compressible',
    ),
  };

  const compressionSavingsProps = {
    stats: Number(poolCompressionSavings),
    isLoading: loading,
    error: loadError || !poolCompressionSavings,
    title: t('ceph-storage-plugin~Compression savings'),
    getStats: () => humanizeBinaryBytes(poolCompressionSavings).string,
    infoText: t(
      'ceph-storage-plugin~Compression savings indicates the total savings gained from compression for this pool, including replicas',
    ),
  };

  const compressionRatioProps = {
    stats: Number(poolCompressionRatio),
    isLoading: loading,
    error: loadError || !poolCompressionRatio,
    title: t('ceph-storage-plugin~Compression ratio'),
    getStats: () => `${humanizeNumber(poolCompressionRatio).string}:1`,
    infoText: t(
      'ceph-storage-plugin~Compression ratio indicates the achieved compression on eligible data for this pool',
    ),
  };

  return (
    <DashboardCard data-test-id="compression-details-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Compression')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <DetailsBody>
          <DetailItem isLoading={!obj} title={t('ceph-storage-plugin~Compression status')}>
            {!compressionEnabled
              ? t('ceph-storage-plugin~Disabled')
              : t('ceph-storage-plugin~Enabled')}
          </DetailItem>
        </DetailsBody>
        {compressionEnabled && (
          <DetailsBody>
            <div>
              <DetailsBody>
                <DetailItem isLoading={loading} title={t('ceph-storage-plugin~Storage efficiency')}>
                  <EfficiencyItemBody {...compressionEligibilityProps} />
                  <EfficiencyItemBody {...compressionRatioProps} />
                  <EfficiencyItemBody {...compressionSavingsProps} />
                </DetailItem>
              </DetailsBody>
            </div>
          </DetailsBody>
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
};
