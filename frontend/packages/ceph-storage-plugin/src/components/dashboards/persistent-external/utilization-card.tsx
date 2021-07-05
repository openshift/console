import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCardTitle from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardHeader from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCard from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCard';
import { Dropdown, humanizeBinaryBytes } from '@console/internal/components/utils';
import UtilizationBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/dynamic-plugin-sdk/src/shared/graph-helper/data-utils';
import DashboardCardBody from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/dashboard-card/DashboardCardBody';
import {
  useMetricDuration,
  Duration,
} from '@console/dynamic-plugin-sdk/src/shared/components/dashboard/duration-hook';
import { PrometheusUtilizationItem } from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import { StorageDashboardQuery, INDEPENDENT_UTILIZATION_QUERIES } from '../../../queries';

export const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const [duration, setDuration] = useMetricDuration(t);
  const [timestamps, setTimestamps] = React.useState<Date[]>();

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('ceph-storage-plugin~Utilization')}</DashboardCardTitle>
        <Dropdown
          items={Duration(t)}
          onChange={setDuration}
          selectedKey={duration}
          title={duration}
        />
      </DashboardCardHeader>
      <DashboardCardBody>
        <UtilizationBody timestamps={timestamps}>
          <PrometheusUtilizationItem
            title={t('ceph-storage-plugin~Used Capacity')}
            utilizationQuery={INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.USED_CAPACITY]}
            duration={duration}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            setTimestamps={setTimestamps}
          />
          <PrometheusUtilizationItem
            title={t('ceph-storage-plugin~Requested capacity')}
            utilizationQuery={
              INDEPENDENT_UTILIZATION_QUERIES[StorageDashboardQuery.REQUESTED_CAPACITY]
            }
            duration={duration}
            humanizeValue={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            setTimestamps={setTimestamps}
          />
        </UtilizationBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
