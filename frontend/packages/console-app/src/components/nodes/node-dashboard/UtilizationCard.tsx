import * as React from 'react';
import { PopoverPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
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
import { PodModel, ProjectModel } from '@console/internal/models';
import {
  humanizeCpuCores,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  humanizeNumber,
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
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';
import { DEFAULT_DURATION, useDateRange } from '@console/shared';

const getPodConsumers = (query: string, nodeName: string) => ({
  query,
  model: PodModel,
  fieldSelector: `spec.nodeName=${nodeName}`,
  metric: 'pod',
});

const getProjectConsumers = (query: string) => ({
  query,
  model: ProjectModel,
  metric: 'namespace',
});

export const CPUPopover: React.FC<PopoverProps> = ({
  nodeName,
  nodeIp,
  current,
  title,
  position = PopoverPosition.top,
  ...rest
}) => {
  const consumers = React.useMemo(() => {
    const queries = getTopConsumerQueries(nodeIp);
    return [
      getProjectConsumers(queries[NodeQueries.PROJECTS_BY_CPU]),
      getPodConsumers(queries[NodeQueries.PODS_BY_CPU], nodeName),
    ];
  }, [nodeIp, nodeName]);
  const { t } = useTranslation();
  return (
    <ConsumerPopover
      current={title}
      title={t('nodes~CPU')}
      consumers={consumers}
      humanize={humanizeCpuCores}
      position={position}
    >
      <LimitsBody {...rest} current={current} />
    </ConsumerPopover>
  );
};

export const MemoryPopover: React.FC<PopoverProps> = ({
  nodeName,
  nodeIp,
  current,
  title,
  position = PopoverPosition.top,
  ...rest
}) => {
  const consumers = React.useMemo(() => {
    const queries = getTopConsumerQueries(nodeIp);
    return [
      getProjectConsumers(queries[NodeQueries.PROJECTS_BY_MEMORY]),
      getPodConsumers(queries[NodeQueries.PODS_BY_MEMORY], nodeName),
    ];
  }, [nodeIp, nodeName]);
  const { t } = useTranslation();
  return (
    <ConsumerPopover
      current={title}
      title={t('nodes~Memory')}
      consumers={consumers}
      humanize={humanizeBinaryBytes}
      position={position}
    >
      <LimitsBody {...rest} current={current} />
    </ConsumerPopover>
  );
};

const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const [duration, setDuration] = React.useState(DEFAULT_DURATION);
  const [startDate, endDate, updateEndDate] = useDateRange(duration);

  const { obj, setCPULimit, setMemoryLimit } = React.useContext(NodeDashboardContext);

  const nodeName = obj.metadata.name;
  const nodeIp = getNodeAddresses(obj).find((addr) => addr.type === 'InternalIP')?.address;

  const [queries, multilineQueries, resourceQuotaQueries, consumers] = React.useMemo(() => {
    const topConsumerQueries = getTopConsumerQueries(nodeIp);
    return [
      getUtilizationQueries(nodeName, nodeIp),
      getMultilineQueries(nodeName),
      getResourceQutoaQueries(nodeName),
      [
        [
          getProjectConsumers(topConsumerQueries[NodeQueries.PROJECTS_BY_FILESYSTEM]),
          getPodConsumers(topConsumerQueries[NodeQueries.PODS_BY_FILESYSTEM], nodeName),
        ],
        [
          getProjectConsumers(topConsumerQueries[NodeQueries.PROJECTS_BY_NETWORK_IN]),
          getPodConsumers(topConsumerQueries[NodeQueries.PODS_BY_NETWORK_IN], nodeName),
        ],
        [
          getProjectConsumers(topConsumerQueries[NodeQueries.PROJECTS_BY_NETWORK_OUT]),
          getPodConsumers(topConsumerQueries[NodeQueries.PODS_BY_NETWORK_OUT], nodeName),
        ],
      ],
    ];
  }, [nodeIp, nodeName]);

  const cpuPopover = React.useCallback(
    (props: TopConsumerPopoverProp) => (
      <CPUPopover {...props} title={props.current} nodeIp={nodeIp} nodeName={nodeName} />
    ),
    [nodeIp, nodeName],
  );

  const memPopover = React.useCallback(
    (props: TopConsumerPopoverProp) => (
      <MemoryPopover {...props} title={props.current} nodeIp={nodeIp} nodeName={nodeName} />
    ),
    [nodeIp, nodeName],
  );

  const filesystemPopover = React.useCallback(
    ({ current }: TopConsumerPopoverProp) => (
      <ConsumerPopover
        title={t('nodes~Filesystem')}
        current={current}
        consumers={consumers[0]}
        humanize={humanizeBinaryBytes}
        position={PopoverPosition.top}
      />
    ),
    [consumers, t],
  );

  const networkPopoverIn = React.useCallback(
    ({ current }: TopConsumerPopoverProp) => (
      <ConsumerPopover
        title={t('nodes~Network in')}
        current={current}
        consumers={consumers[1]}
        humanize={humanizeDecimalBytesPerSec}
        position={PopoverPosition.top}
      />
    ),
    [consumers, t],
  );

  const networkPopoverOut = React.useCallback(
    ({ current }: TopConsumerPopoverProp) => (
      <ConsumerPopover
        title={t('nodes~Network out')}
        current={current}
        consumers={consumers[2]}
        humanize={humanizeDecimalBytesPerSec}
        position={PopoverPosition.top}
      />
    ),
    [consumers, t],
  );

  const networkPopovers = React.useMemo(() => [networkPopoverIn, networkPopoverOut], [
    networkPopoverIn,
    networkPopoverOut,
  ]);

  return (
    <DashboardCard data-test-id="utilization-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('nodes~Utilization')}</DashboardCardTitle>
        <UtilizationDurationDropdown onChange={setDuration} />
      </DashboardCardHeader>
      <UtilizationBody startDate={startDate} endDate={endDate}>
        <PrometheusUtilizationItem
          title={t('nodes~CPU')}
          humanizeValue={humanizeCpuCores}
          utilizationQuery={queries[NodeQueries.CPU_USAGE]}
          totalQuery={queries[NodeQueries.CPU_TOTAL]}
          limitQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_LIMIT_CPU]}
          requestQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_REQUEST_CPU]}
          TopConsumerPopover={cpuPopover}
          duration={duration}
          setLimitReqState={setCPULimit}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('nodes~Memory')}
          humanizeValue={humanizeBinaryBytes}
          utilizationQuery={queries[NodeQueries.MEMORY_USAGE]}
          totalQuery={queries[NodeQueries.MEMORY_TOTAL]}
          limitQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_LIMIT_MEMORY]}
          requestQuery={resourceQuotaQueries[NodeQueries.POD_RESOURCE_REQUEST_MEMORY]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={memPopover}
          duration={duration}
          setLimitReqState={setMemoryLimit}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('nodes~Filesystem')}
          humanizeValue={humanizeBinaryBytes}
          utilizationQuery={queries[NodeQueries.FILESYSTEM_USAGE]}
          totalQuery={queries[NodeQueries.FILESYSTEM_TOTAL]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={filesystemPopover}
          duration={duration}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusMultilineUtilizationItem
          title={t('nodes~Network transfer')}
          humanizeValue={humanizeDecimalBytesPerSec}
          queries={multilineQueries[NodeQueries.NETWORK_UTILIZATION]}
          TopConsumerPopovers={networkPopovers}
          duration={duration}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('nodes~Pod count')}
          humanizeValue={humanizeNumber}
          utilizationQuery={queries[NodeQueries.POD_COUNT]}
          duration={duration}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export default UtilizationCard;

export type PopoverProps = TopConsumerPopoverProp & {
  nodeIp: string;
  nodeName: string;
  title: string;
  position?: PopoverPosition;
};
