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
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import { DEFAULT_DURATION, useDateRange } from '@console/shared';
import { humanizeIOPS, humanizeLatency } from './utils';
import {
  StorageDashboardQuery,
  UTILIZATION_QUERY,
  utilizationPopoverQueryMap,
} from '../../../../queries';

const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const [duration, setDuration] = React.useState(DEFAULT_DURATION);
  const [startDate, endDate, updateEndDate] = useDateRange(duration);

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
        <UtilizationDurationDropdown onChange={setDuration} />
      </DashboardCardHeader>
      <UtilizationBody startDate={startDate} endDate={endDate}>
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Used Capacity')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED]}
          duration={duration}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={storagePopover}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~IOPS')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_QUERY]}
          duration={duration}
          humanizeValue={humanizeIOPS}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Latency')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_QUERY]}
          duration={duration}
          humanizeValue={humanizeLatency}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Throughput')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY]}
          duration={duration}
          humanizeValue={humanizeDecimalBytesPerSec}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Recovery')}
          utilizationQuery={
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY]
          }
          duration={duration}
          humanizeValue={humanizeDecimalBytesPerSec}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
