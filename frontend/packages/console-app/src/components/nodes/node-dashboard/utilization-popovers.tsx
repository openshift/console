import * as React from 'react';
import { PopoverPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { TopConsumerPopoverProps } from '@console/dynamic-plugin-sdk';
import {
  humanizeCpuCores,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils';
import { PodModel, ProjectModel } from '@console/internal/models';
import ConsumerPopover, {
  LimitsBody,
} from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { NodeQueries, getTopConsumerQueries } from './queries';

export const NodeUtilizationContext = React.createContext({
  nodeIP: '',
  nodeName: '',
});

const useConsumers = (nsQuery: NodeQueries, podQuery: NodeQueries) => {
  const { nodeIP, nodeName } = React.useContext(NodeUtilizationContext);
  return React.useMemo(() => {
    const queries = getTopConsumerQueries(nodeIP);
    return [
      {
        query: queries[nsQuery],
        model: ProjectModel,
        metric: 'namespace',
      },
      {
        query: queries[podQuery],
        model: PodModel,
        fieldSelector: `spec.nodeName=${nodeName}`,
        metric: 'pod',
      },
    ];
  }, [nsQuery, podQuery, nodeIP, nodeName]);
};

export type PopoverProps = TopConsumerPopoverProps & {
  title?: string;
  position?: PopoverPosition;
};

export const CPUPopover: React.FC<PopoverProps> = ({ current, position, title, ...rest }) => {
  const consumers = useConsumers(NodeQueries.PROJECTS_BY_CPU, NodeQueries.PODS_BY_CPU);
  const { t } = useTranslation();
  return (
    <ConsumerPopover
      current={current}
      title={title || t('console-app~CPU')}
      consumers={consumers}
      humanize={humanizeCpuCores}
      position={position}
    >
      <LimitsBody {...rest} current={current} />
    </ConsumerPopover>
  );
};

export const MemoryPopover: React.FC<PopoverProps> = ({ current, position, title, ...rest }) => {
  const consumers = useConsumers(NodeQueries.PROJECTS_BY_MEMORY, NodeQueries.PODS_BY_MEMORY);
  const { t } = useTranslation();
  return (
    <ConsumerPopover
      current={current}
      title={title || t('console-app~Memory')}
      consumers={consumers}
      humanize={humanizeBinaryBytes}
      position={position}
    >
      <LimitsBody {...rest} current={current} />
    </ConsumerPopover>
  );
};

export const FilesystemPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(
    NodeQueries.PROJECTS_BY_FILESYSTEM,
    NodeQueries.PODS_BY_FILESYSTEM,
  );
  return (
    <ConsumerPopover
      title={t('console-app~Filesystem')}
      current={current}
      consumers={consumers}
      humanize={humanizeBinaryBytes}
    />
  );
};

export const NetworkInPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(
    NodeQueries.PROJECTS_BY_NETWORK_IN,
    NodeQueries.PODS_BY_NETWORK_IN,
  );
  return (
    <ConsumerPopover
      title={t('console-app~Network in')}
      current={current}
      consumers={consumers}
      humanize={humanizeDecimalBytesPerSec}
    />
  );
};

export const NetworkOutPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(
    NodeQueries.PROJECTS_BY_NETWORK_OUT,
    NodeQueries.PODS_BY_NETWORK_OUT,
  );
  return (
    <ConsumerPopover
      title={t('console-app~Network out')}
      current={current}
      consumers={consumers}
      humanize={humanizeDecimalBytesPerSec}
    />
  );
};
