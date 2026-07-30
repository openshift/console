import type { FC } from 'react';
import { createContext, useContext, useMemo } from 'react';
import type { PopoverPosition } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type { TopConsumerPopoverProps } from '@console/dynamic-plugin-sdk';
import {
  humanizeCpuCores,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
} from '@console/internal/components/utils/units';
import { PodModel, ProjectModel } from '@console/internal/models';
import ConsumerPopover, {
  LimitsBody,
} from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { NodeQueries, getTopConsumerQueries } from './queries';

export const NodeUtilizationContext = createContext({
  nodeIP: '',
  nodeName: '',
});

const useConsumers = (nsQuery: NodeQueries, podQuery: NodeQueries) => {
  const { nodeIP, nodeName } = useContext(NodeUtilizationContext);
  return useMemo(() => {
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

export const CPUPopover: FC<PopoverProps> = ({ current, position, title, ...rest }) => {
  const consumers = useConsumers(NodeQueries.PROJECTS_BY_CPU, NodeQueries.PODS_BY_CPU);
  const { t } = useTranslation('console-app');
  return (
    <ConsumerPopover
      current={current}
      title={title || t('CPU')}
      consumers={consumers}
      humanize={humanizeCpuCores}
      position={position}
    >
      <LimitsBody {...rest} current={current} />
    </ConsumerPopover>
  );
};

export const MemoryPopover: FC<PopoverProps> = ({ current, position, title, ...rest }) => {
  const consumers = useConsumers(NodeQueries.PROJECTS_BY_MEMORY, NodeQueries.PODS_BY_MEMORY);
  const { t } = useTranslation('console-app');
  return (
    <ConsumerPopover
      current={current}
      title={title || t('Memory')}
      consumers={consumers}
      humanize={humanizeBinaryBytes}
      position={position}
    >
      <LimitsBody {...rest} current={current} />
    </ConsumerPopover>
  );
};

export const FilesystemPopover: FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation('console-app');
  const consumers = useConsumers(
    NodeQueries.PROJECTS_BY_FILESYSTEM,
    NodeQueries.PODS_BY_FILESYSTEM,
  );
  return (
    <ConsumerPopover
      title={t('Filesystem')}
      current={current}
      consumers={consumers}
      humanize={humanizeBinaryBytes}
    />
  );
};

export const NetworkInPopover: FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation('console-app');
  const consumers = useConsumers(
    NodeQueries.PROJECTS_BY_NETWORK_IN,
    NodeQueries.PODS_BY_NETWORK_IN,
  );
  return (
    <ConsumerPopover
      title={t('Network in')}
      current={current}
      consumers={consumers}
      humanize={humanizeDecimalBytesPerSec}
    />
  );
};

export const NetworkOutPopover: FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation('console-app');
  const consumers = useConsumers(
    NodeQueries.PROJECTS_BY_NETWORK_OUT,
    NodeQueries.PODS_BY_NETWORK_OUT,
  );
  return (
    <ConsumerPopover
      title={t('Network out')}
      current={current}
      consumers={consumers}
      humanize={humanizeDecimalBytesPerSec}
    />
  );
};
