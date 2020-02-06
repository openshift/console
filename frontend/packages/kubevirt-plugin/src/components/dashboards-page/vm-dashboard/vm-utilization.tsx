import * as React from 'react';
import {
  Dropdown,
  humanizeBinaryBytes,
  humanizeCpuCores as humanizeCpuCoresUtil,
} from '@console/internal/components/utils';
import { getName, getNamespace, getCreationTimestamp } from '@console/shared';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import {
  PrometheusUtilizationItem,
  PrometheusMultilineUtilizationItem,
} from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import {
  useMetricDuration,
  Duration,
} from '@console/shared/src/components/dashboard/duration-hook';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { VMDashboardContext } from '../../vms/vm-dashboard-context';
import { findVMPod } from '../../../selectors/pod/selectors';
import { isVMRunningWithVMI } from '../../../selectors/vm';
import { getUtilizationQueries, getMultilineUtilizationQueries, VMQueries } from './queries';
import { getPrometheusQeuryEndTimestamp } from '@console/internal/components/graphs/helpers';
import { VMIKind } from 'packages/kubevirt-plugin/src/types';

// TODO: extend humanizeCpuCores() from @console/internal for the flexibility of space
const humanizeCpuCores = (v) => {
  const humanized = humanizeCpuCoresUtil(v);
  // add space betwee value and unit
  const val = humanized.string.match(/[\d.]+/) || [humanized.string];
  humanized.string = `${val[0]} ${humanized.unit}`;
  return humanized;
};

const adjustDurationForVMI = (start: number, vmi?: VMIKind): number => {
  const createdAt: string = getCreationTimestamp(vmi);
  const endTimestamp = getPrometheusQeuryEndTimestamp();
  const startTimestamp = getPrometheusQeuryEndTimestamp() - start;
  if (createdAt) {
    const createdAtTimestamp = Date.parse(createdAt);
    const adjustedStart = endTimestamp - createdAtTimestamp;
    return startTimestamp > createdAtTimestamp ? start : adjustedStart;
  }

  return start;
};

export const VMUtilizationCard: React.FC = () => {
  const [timestamps, setTimestamps] = React.useState<Date[]>();
  const [duration, setDuration] = useMetricDuration();
  const { vm, vmi, pods } = React.useContext(VMDashboardContext);
  const vmiLike = vm || vmi;
  const vmName = getName(vmiLike);
  const namespace = getNamespace(vmiLike);
  const launcherPodName = getName(findVMPod(vmiLike, pods));
  const vmIsRunning = isVMRunningWithVMI({ vm, vmi });

  const queries = React.useMemo(
    () =>
      getUtilizationQueries({
        vmName,
        namespace,
        launcherPodName,
      }),
    [vmName, namespace, launcherPodName],
  );

  const multilineQueries = React.useMemo(
    () =>
      getMultilineUtilizationQueries({
        vmName,
        namespace,
        launcherPodName,
      }),
    [vmName, namespace, launcherPodName],
  );

  const adjustDuration = React.useMemo(() => {
    return (start: number) => adjustDurationForVMI(start, vmi);
  }, [vmi]);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Utilization</DashboardCardTitle>
        <Dropdown items={Duration} onChange={setDuration} selectedKey={duration} title={duration} />
      </DashboardCardHeader>
      <UtilizationBody timestamps={timestamps}>
        <PrometheusUtilizationItem
          title="CPU"
          utilizationQuery={queries[VMQueries.CPU_USAGE]}
          humanizeValue={humanizeCpuCores}
          duration={duration}
          adjustDuration={adjustDuration}
          setTimestamps={setTimestamps}
          namespace={namespace}
          isDisabled={!vmIsRunning}
        />
        <PrometheusUtilizationItem
          title="Memory"
          utilizationQuery={queries[VMQueries.MEMORY_USAGE]}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          duration={duration}
          namespace={namespace}
          adjustDuration={adjustDuration}
          isDisabled={!vmIsRunning}
        />
        <PrometheusUtilizationItem
          title="Filesystem"
          utilizationQuery={queries[VMQueries.FILESYSTEM_USAGE]}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          duration={duration}
          namespace={namespace}
          adjustDuration={adjustDuration}
          isDisabled={!vmIsRunning}
        />
        <PrometheusMultilineUtilizationItem
          title="Network Transfer"
          queries={multilineQueries[VMQueries.NETWORK_USAGE]}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          duration={duration}
          namespace={namespace}
          adjustDuration={adjustDuration}
          isDisabled={!vmIsRunning}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

VMUtilizationCard.displayName = 'VMUtilizationCard';
