import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardTitle';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import {
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  FieldLevelHelp,
} from '@console/internal/components/utils';
import UtilizationBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/dynamic-plugin-sdk/src/shared/graph-helper/data-utils';
import ConsumerPopover from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/utilization-card/TopConsumerPopover';
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import {
  useMetricDuration,
  Duration,
} from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/duration-hook';
import { humanizeIOPS, humanizeLatency } from './utils';
import {
  StorageDashboardQuery,
  UTILIZATION_QUERY,
  utilizationPopoverQueryMap,
} from '../../../../queries';

const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const [duration, setDuration] = useMetricDuration(t);
  const [timestamps, setTimestamps] = React.useState<Date[]>();

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
        <Dropdown
          items={Duration(t)}
          onChange={setDuration}
          selectedKey={duration}
          title={duration}
        />
      </DashboardCardHeader>
      <UtilizationBody timestamps={timestamps}>
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Used Capacity')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.CEPH_CAPACITY_USED]}
          duration={duration}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          setTimestamps={setTimestamps}
          TopConsumerPopover={storagePopover}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~IOPS')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_IOPS_QUERY]}
          duration={duration}
          humanizeValue={humanizeIOPS}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Latency')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_LATENCY_QUERY]}
          duration={duration}
          humanizeValue={humanizeLatency}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Throughput')}
          utilizationQuery={UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_THROUGHPUT_QUERY]}
          duration={duration}
          humanizeValue={humanizeDecimalBytesPerSec}
        />
        <PrometheusUtilizationItem
          title={t('ceph-storage-plugin~Recovery')}
          utilizationQuery={
            UTILIZATION_QUERY[StorageDashboardQuery.UTILIZATION_RECOVERY_RATE_QUERY]
          }
          duration={duration}
          humanizeValue={humanizeDecimalBytesPerSec}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
