import * as React from 'react';
import { PopoverPosition } from '@patternfly/react-core';
import {
  useMetricDuration,
  Duration,
} from '@console/shared/src/components/dashboard/duration-hook';
import { TopConsumerPopoverProp } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import ConsumerPopover, {
  LimitsBody,
} from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { getNodeAddresses } from '@console/shared/src/selectors/node';
import { PodModel } from '@console/internal/models';
import {
  humanizeCpuCores,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  humanizeNumber,
  Dropdown,
} from '@console/internal/components/utils';
import {
  PrometheusUtilizationItem,
  PrometheusMultilineUtilizationItem,
} from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';

import {
  NodeQueries,
  getUtilizationQueries,
  getMultilineQueries,
  getTopConsumerQueries,
  getResourceQutoaQueries,
} from './queries';
import { NodeDashboardContext } from './NodeDashboardContext';

const getPodConsumers = (query: string, nodeName: string) => ({
  query,
  model: PodModel,
  fieldSelector: `spec.nodeName=${nodeName}`,
  metric: 'pod',
});

const UtilizationCard: React.FC = () => {
  const [timestamps, setTimestamps] = React.useState<Date[]>();
  const [duration, setDuration] = useMetricDuration();

  const { obj } = React.useContext(NodeDashboardContext);

  const nodeName = obj.metadata.name;
  const nodeIp = getNodeAddresses(obj).find((addr) => addr.type === 'InternalIP')?.address;

  const queries = React.useMemo(() => getUtilizationQueries(nodeName, nodeIp), [nodeName, nodeIp]);
  const [multilineQueries, resourceQuotaQueries] = React.useMemo(
    () => [getMultilineQueries(nodeName), getResourceQutoaQueries(nodeName)],
    [nodeName],
  );
  const topConsumerQueries = React.useMemo(() => getTopConsumerQueries(nodeIp), [nodeIp]);

  const consumers = React.useMemo(
    () => [
      [getPodConsumers(topConsumerQueries[NodeQueries.PODS_BY_CPU], nodeName)],
      [getPodConsumers(topConsumerQueries[NodeQueries.PODS_BY_MEMORY], nodeName)],
      [getPodConsumers(topConsumerQueries[NodeQueries.PODS_BY_FILESYSTEM], nodeName)],
      [getPodConsumers(topConsumerQueries[NodeQueries.PODS_BY_NETWORK_IN], nodeName)],
      [getPodConsumers(topConsumerQueries[NodeQueries.PODS_BY_NETWORK_OUT], nodeName)],
    ],
    [nodeName, topConsumerQueries],
  );

  const cpuPopover = React.useCallback(
    ({ current, LimitIcon, ...rest }: TopConsumerPopoverProp) => (
      <ConsumerPopover
        current={current}
        title="CPU"
        consumers={consumers[0]}
        humanize={humanizeCpuCores}
        position={PopoverPosition.top}
      >
        {LimitIcon && <LimitsBody {...rest} LimitIcon={LimitIcon} current={current} />}
      </ConsumerPopover>
    ),
    [consumers],
  );

  const memPopover = React.useCallback(
    ({ current, LimitIcon, ...rest }: TopConsumerPopoverProp) => (
      <ConsumerPopover
        current={current}
        title="Memory"
        consumers={consumers[1]}
        humanize={humanizeBinaryBytes}
        position={PopoverPosition.top}
      >
        {LimitIcon && <LimitsBody {...rest} LimitIcon={LimitIcon} current={current} />}
      </ConsumerPopover>
    ),
    [consumers],
  );

  const filesystemPopover = React.useCallback(
    ({ current }: TopConsumerPopoverProp) => (
      <ConsumerPopover
        title="Filesystem"
        current={current}
        consumers={consumers[2]}
        humanize={humanizeBinaryBytes}
        position={PopoverPosition.top}
      />
    ),
    [consumers],
  );

  const networkPopoverIn = React.useCallback(
    ({ current }: TopConsumerPopoverProp) => (
      <ConsumerPopover
        title="Network In"
        current={current}
        consumers={consumers[3]}
        humanize={humanizeDecimalBytesPerSec}
        position={PopoverPosition.top}
      />
    ),
    [consumers],
  );

  const networkPopoverOut = React.useCallback(
    ({ current }: TopConsumerPopoverProp) => (
      <ConsumerPopover
        title="Network Out"
        current={current}
        consumers={consumers[4]}
        humanize={humanizeDecimalBytesPerSec}
        position={PopoverPosition.top}
      />
    ),
    [consumers],
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
          utilizationQuery={queries[NodeQueries.CPU_USAGE]}
          totalQuery={queries[NodeQueries.CPU_TOTAL]}
          limitQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_LIMIT_CPU]}
          requestQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_REQUEST_CPU]}
          TopConsumerPopover={cpuPopover}
          duration={duration}
          setTimestamps={setTimestamps}
        />
        <PrometheusUtilizationItem
          title="Memory"
          humanizeValue={humanizeBinaryBytes}
          utilizationQuery={queries[NodeQueries.MEMORY_USAGE]}
          totalQuery={queries[NodeQueries.MEMORY_TOTAL]}
          limitQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_LIMIT_MEMORY]}
          requestQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_REQUEST_MEMORY]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={memPopover}
          duration={duration}
        />
        <PrometheusUtilizationItem
          title="Filesystem"
          humanizeValue={humanizeBinaryBytes}
          utilizationQuery={queries[NodeQueries.FILESYSTEM_USAGE]}
          totalQuery={queries[NodeQueries.FILESYSTEM_TOTAL]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={filesystemPopover}
          duration={duration}
        />
        <PrometheusMultilineUtilizationItem
          title="Network Transfer"
          humanizeValue={humanizeDecimalBytesPerSec}
          queries={multilineQueries[NodeQueries.NETWORK_UTILIZATION]}
          TopConsumerPopovers={networkPopovers}
          duration={duration}
        />
        <PrometheusUtilizationItem
          title="Pod count"
          humanizeValue={humanizeNumber}
          utilizationQuery={queries[NodeQueries.POD_COUNT]}
          duration={duration}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export default UtilizationCard;
