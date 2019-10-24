import * as React from 'react';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { PodModel, ProjectModel } from '@console/internal/models';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import { getMachineNodeName } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  PrometheusUtilizationItem,
  PrometheusMultilineUtilizationItem,
} from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import {
  useMetricDuration,
  Duration,
} from '@console/shared/src/components/dashboard/duration-hook';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';
import {
  getUtilizationQueries,
  HostQuery,
  getTopConsumerQueries,
  getMultilineUtilizationQueries,
} from './queries';

const UtilizationCard: React.FC = () => {
  const [timestamps, setTimestamps] = React.useState<Date[]>();
  const [duration, setDuration] = useMetricDuration();

  const { machine } = React.useContext(BareMetalHostDashboardContext);
  const nodeName = getMachineNodeName(machine);

  const queries = React.useMemo(() => getUtilizationQueries(nodeName), [nodeName]);
  const multilineQueries = React.useMemo(() => getMultilineUtilizationQueries(nodeName), [
    nodeName,
  ]);

  const humanizePods = React.useCallback(
    (v) => ({
      string: `${v}`,
      value: v as number,
      unit: '',
    }),
    [],
  );

  const cpuPopover = React.useCallback(
    ({ current }) => {
      const topConsumerQueries = getTopConsumerQueries(nodeName);
      return (
        <ConsumerPopover
          title="CPU"
          current={current}
          humanize={humanizeCpuCores}
          consumers={[
            {
              query: topConsumerQueries[HostQuery.PROJECTS_BY_CPU],
              model: ProjectModel,
              metric: 'namespace',
            },
            {
              query: topConsumerQueries[HostQuery.PODS_BY_CPU],
              model: PodModel,
              metric: 'pod',
            },
          ]}
        />
      );
    },
    [nodeName],
  );

  const memPopover = React.useCallback(
    ({ current }) => {
      const topConsumerQueries = getTopConsumerQueries(nodeName);
      return (
        <ConsumerPopover
          title="Memory"
          current={current}
          humanize={humanizeBinaryBytes}
          consumers={[
            {
              query: topConsumerQueries[HostQuery.PROJECTS_BY_MEMORY],
              model: ProjectModel,
              metric: 'namespace',
            },
            {
              query: topConsumerQueries[HostQuery.PODS_BY_MEMORY],
              model: PodModel,
              metric: 'pod',
            },
          ]}
        />
      );
    },
    [nodeName],
  );

  const storagePopover = React.useCallback(
    ({ current }) => {
      const topConsumerQueries = getTopConsumerQueries(nodeName);
      return (
        <ConsumerPopover
          title="Disk Usage"
          current={current}
          humanize={humanizeBinaryBytes}
          consumers={[
            {
              query: topConsumerQueries[HostQuery.PROJECTS_BY_STORAGE],
              model: ProjectModel,
              metric: 'namespace',
            },
            {
              query: topConsumerQueries[HostQuery.PODS_BY_STORAGE],
              model: PodModel,
              metric: 'pod',
            },
          ]}
        />
      );
    },
    [nodeName],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Utilization</DashboardCardTitle>
        <Dropdown items={Duration} onChange={setDuration} selectedKey={duration} title={duration} />
      </DashboardCardHeader>
      <UtilizationBody timestamps={timestamps}>
        <PrometheusUtilizationItem
          title="CPU usage"
          utilizationQuery={queries[HostQuery.CPU_UTILIZATION].utilization}
          humanizeValue={humanizeCpuCores}
          TopConsumerPopover={cpuPopover}
          duration={duration}
          setTimestamps={setTimestamps}
        />
        <PrometheusUtilizationItem
          title="Memory usage"
          utilizationQuery={queries[HostQuery.MEMORY_UTILIZATION].utilization}
          totalQuery={queries[HostQuery.MEMORY_UTILIZATION].total}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={memPopover}
          duration={duration}
        />
        <PrometheusUtilizationItem
          title="Number of pods"
          utilizationQuery={queries[HostQuery.NUMBER_OF_PODS].utilization}
          humanizeValue={humanizePods}
          duration={duration}
        />
        <PrometheusMultilineUtilizationItem
          title="Network Transfer"
          queries={multilineQueries[HostQuery.NETWORK_UTILIZATION]}
          humanizeValue={humanizeDecimalBytesPerSec}
          duration={duration}
        />
        <PrometheusUtilizationItem
          title="Filesystem"
          utilizationQuery={queries[HostQuery.STORAGE_UTILIZATION].utilization}
          totalQuery={queries[HostQuery.STORAGE_UTILIZATION].total}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={storagePopover}
          duration={duration}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
