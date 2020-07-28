import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { TopConsumerPopoverProp } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import { getName } from '@console/shared';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { PopoverPosition } from '@patternfly/react-core';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { Dropdown } from '../../utils/dropdown';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
  humanizeNumber,
} from '../../utils';
import { ProjectDashboardContext } from './project-dashboard-context';
import { PodModel } from '../../../models';
import {
  useMetricDuration,
  Duration,
} from '@console/shared/src/components/dashboard/duration-hook';
import {
  getUtilizationQueries,
  ProjectQueries,
  getTopConsumerQueries,
  getMultilineQueries,
} from '@console/shared/src/promql/project-dashboard';
import {
  PrometheusUtilizationItem,
  PrometheusMultilineUtilizationItem,
} from '../dashboards-page/cluster-dashboard/utilization-card';

export const UtilizationCard: React.FC = () => {
  const [timestamps, setTimestamps] = React.useState<Date[]>();
  const [duration, setDuration] = useMetricDuration();
  const { obj } = React.useContext(ProjectDashboardContext);
  const projectName = getName(obj);
  const queries = React.useMemo(() => getUtilizationQueries(projectName), [projectName]);
  const multilineQueries = React.useMemo(() => getMultilineQueries(projectName), [projectName]);

  const cpuPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title="CPU"
        current={current}
        consumers={[
          {
            query: getTopConsumerQueries(projectName)[ProjectQueries.PODS_BY_CPU],
            model: PodModel,
            metric: 'pod',
          },
        ]}
        humanize={humanizeCpuCores}
        namespace={projectName}
        position={PopoverPosition.top}
      />
    )),
    [projectName],
  );

  const memPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title="Memory"
        current={current}
        consumers={[
          {
            query: getTopConsumerQueries(projectName)[ProjectQueries.PODS_BY_MEMORY],
            model: PodModel,
            metric: 'pod',
          },
        ]}
        humanize={humanizeBinaryBytes}
        namespace={projectName}
        position={PopoverPosition.top}
      />
    )),
    [projectName],
  );

  const filesystemPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title="Filesystem"
        current={current}
        consumers={[
          {
            query: getTopConsumerQueries(projectName)[ProjectQueries.PODS_BY_FILESYSTEM],
            model: PodModel,
            metric: 'pod',
          },
        ]}
        humanize={humanizeBinaryBytes}
        namespace={projectName}
        position={PopoverPosition.top}
      />
    )),
    [projectName],
  );

  const networkPopoverIn = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title="Network In"
        current={current}
        consumers={[
          {
            query: getTopConsumerQueries(projectName)[ProjectQueries.PODS_BY_NETWORK_IN],
            model: PodModel,
            metric: 'pod',
          },
        ]}
        humanize={humanizeDecimalBytesPerSec}
        namespace={projectName}
        position={PopoverPosition.top}
      />
    )),
    [projectName],
  );

  const networkPopoverOut = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title="Network Out"
        current={current}
        consumers={[
          {
            query: getTopConsumerQueries(projectName)[ProjectQueries.PODS_BY_NETWORK_OUT],
            model: PodModel,
            metric: 'pod',
          },
        ]}
        humanize={humanizeDecimalBytesPerSec}
        namespace={projectName}
        position={PopoverPosition.top}
      />
    )),
    [projectName],
  );

  const networkPopovers = React.useMemo(() => [networkPopoverIn, networkPopoverOut], [
    networkPopoverIn,
    networkPopoverOut,
  ]);

  return (
    <DashboardCard data-test-id="utilization-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Utilization</DashboardCardTitle>
        <Dropdown items={Duration} onChange={setDuration} selectedKey={duration} title={duration} />
      </DashboardCardHeader>
      <UtilizationBody timestamps={timestamps}>
        <PrometheusUtilizationItem
          title="CPU"
          humanizeValue={humanizeCpuCores}
          utilizationQuery={queries[ProjectQueries.CPU_USAGE]}
          TopConsumerPopover={cpuPopover}
          duration={duration}
          setTimestamps={setTimestamps}
          namespace={projectName}
        />
        <PrometheusUtilizationItem
          title="Memory"
          humanizeValue={humanizeBinaryBytes}
          utilizationQuery={queries[ProjectQueries.MEMORY_USAGE]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={memPopover}
          duration={duration}
          namespace={projectName}
        />
        <PrometheusUtilizationItem
          title="Filesystem"
          humanizeValue={humanizeBinaryBytes}
          utilizationQuery={queries[ProjectQueries.FILESYSTEM_USAGE]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={filesystemPopover}
          duration={duration}
          namespace={projectName}
        />
        <PrometheusMultilineUtilizationItem
          title="Network Transfer"
          humanizeValue={humanizeDecimalBytesPerSec}
          queries={multilineQueries[ProjectQueries.NETWORK_UTILIZATION]}
          TopConsumerPopovers={networkPopovers}
          duration={duration}
          namespace={projectName}
        />
        <PrometheusUtilizationItem
          title="Pod count"
          humanizeValue={humanizeNumber}
          utilizationQuery={queries[ProjectQueries.POD_COUNT]}
          duration={duration}
          namespace={projectName}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};
