import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  FieldLevelHelp,
} from '@console/internal/components/utils';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import {
  PrometheusMultilineUtilizationItem,
  PrometheusUtilizationItem,
} from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import { humanizeIOPS, humanizeLatency } from './utils';
import {
  StorageDashboardQuery,
  UTILIZATION_QUERY,
  utilizationPopoverQueryMap,
} from '../../../../queries';

const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const storagePopover = React.useCallback(
    ({ current }) => (
      <ConsumerPopover
        title={t('ceph-storage-plugin~Used Capacity')}
        current={current}
        consumers={utilizationPopoverQueryMap}
        humanize={humanizeBinaryBytes}
      />
    ),
    [t],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          {t('ceph-storage-plugin~Utilization')}
          <FieldLevelHelp>
            {t(
              'ceph-storage-plugin~Performance metrics over time showing IOPS, Latency and more. Each metric is a link to a detailed view of this metric.',
            )}
          </FieldLevelHelp>
        </DashboardCardTitle>
        <UtilizationDurationDropdown />
      </DashboardCardHeader>
      <UtilizationBody>
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Used Capacity')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED]}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={storagePopover}
        />
        <PrometheusMultilineUtilizationItem
          title={t('ceph-storage-plugin~IOPS')}
          queries={[
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_READ_QUERY],
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_WRITE_QUERY],
          ]}
          humanizeValue={humanizeIOPS}
        />
        <PrometheusMultilineUtilizationItem
          title={t('ceph-storage-plugin~Throughput')}
          queries={[
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_READ_QUERY],
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_WRITE_QUERY],
          ]}
          humanizeValue={humanizeDecimalBytesPerSec}
        />
        <PrometheusMultilineUtilizationItem
          title={t('ceph-storage-plugin~Latency')}
          queries={[
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_READ_QUERY],
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_WRITE_QUERY],
          ]}
          humanizeValue={humanizeLatency}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Recovery')}
          utilizationQuery={
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY]
          }
          humanizeValue={humanizeDecimalBytesPerSec}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
