import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  PrometheusMultilineUtilizationItem,
  PrometheusUtilizationItem,
} from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import {
  Dropdown,
  humanizeBinaryBytes,
  humanizeCpuCores as humanizeCpuCoresUtil,
} from '@console/internal/components/utils';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  Duration,
  useMetricDuration,
} from '@console/shared/src/components/dashboard/duration-hook';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { getCreationTimestamp, getName, getNamespace } from '../../../selectors';
import { findVMIPod } from '../../../selectors/pod/selectors';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { getMultilineUtilizationQueries, getUtilizationQueries, VMQueries } from './queries';

// TODO: extend humanizeCpuCores() from @console/internal for the flexibility of space
const humanizeCpuCores = (v) => {
  const humanized = humanizeCpuCoresUtil(v);
  // add space betwee value and unit
  const val = humanized.string.match(/[\d.]+/) || [humanized.string];
  humanized.string = `${val[0]} ${humanized.unit}`;
  return humanized;
};

const adjustDurationForStart = (start: number, createdAt: string): number => {
  if (!createdAt) {
    return start;
  }
  const endTimestamp = Date.now();
  const startTimestamp = endTimestamp - start;
  const createdAtTimestamp = Date.parse(createdAt);
  const adjustedStart = endTimestamp - createdAtTimestamp;
  return startTimestamp > createdAtTimestamp ? start : adjustedStart;
};

export const VMUtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const [timestamps, setTimestamps] = React.useState<Date[]>();
  const [duration, setDuration] = useMetricDuration(t);
  const { vm, vmi, pods } = React.useContext(VMDashboardContext);
  const vmiLike = vm || vmi;
  const vmName = getName(vmiLike);
  const namespace = getNamespace(vmiLike);
  const launcherPodName = getName(findVMIPod(vmi, pods));
  const vmiIsRunning = !!vmi;

  const queries = React.useMemo(
    () =>
      getUtilizationQueries({
        vmName,
        launcherPodName,
      }),
    [vmName, launcherPodName],
  );

  const multilineQueries = React.useMemo(
    () =>
      getMultilineUtilizationQueries({
        vmName,
        launcherPodName,
      }),
    [vmName, launcherPodName],
  );

  const createdAt = getCreationTimestamp(vmi);
  const adjustDuration = React.useCallback(
    (start: number) => adjustDurationForStart(start, createdAt),
    [createdAt],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('kubevirt-plugin~Utilization')}</DashboardCardTitle>
        <Dropdown
          items={Duration(t)}
          onChange={setDuration}
          selectedKey={duration}
          title={duration}
        />
      </DashboardCardHeader>
      <UtilizationBody timestamps={timestamps}>
        <PrometheusUtilizationItem
          title={t('kubevirt-plugin~CPU')}
          utilizationQuery={queries[VMQueries.CPU_USAGE]}
          humanizeValue={humanizeCpuCores}
          duration={duration}
          adjustDuration={adjustDuration}
          setTimestamps={setTimestamps}
          namespace={namespace}
          isDisabled={!vmiIsRunning}
        />
        <PrometheusUtilizationItem
          title={t('kubevirt-plugin~Memory (RSS)')}
          utilizationQuery={queries[VMQueries.MEMORY_USAGE]}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          duration={duration}
          namespace={namespace}
          adjustDuration={adjustDuration}
          isDisabled={!vmiIsRunning}
        />
        <PrometheusMultilineUtilizationItem
          title={t('kubevirt-plugin~Storage')}
          queries={multilineQueries[VMQueries.FILESYSTEM_USAGE]}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          duration={duration}
          namespace={namespace}
          adjustDuration={adjustDuration}
          isDisabled={!vmiIsRunning}
        />
        <PrometheusMultilineUtilizationItem
          title={t('kubevirt-plugin~Network Transfer')}
          queries={multilineQueries[VMQueries.NETWORK_USAGE]}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          duration={duration}
          namespace={namespace}
          adjustDuration={adjustDuration}
          isDisabled={!vmiIsRunning}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

VMUtilizationCard.displayName = 'VMUtilizationCard';
