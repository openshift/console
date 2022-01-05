import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopConsumerPopoverProps } from '@console/dynamic-plugin-sdk';
import {
  getTop25ConsumerQueries,
  OverviewQuery,
} from '@console/shared/src/promql/cluster-dashboard';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { ProjectModel, PodModel, NodeModel } from '../../../../models';
import {
  humanizeCpuCores,
  humanizeBinaryBytes,
  humanizeNumber,
  humanizeDecimalBytesPerSec,
} from '../../../utils';

export const ClusterUtilizationContext = React.createContext('.+');

const useConsumers = (
  nsQuery: OverviewQuery,
  podQuery: OverviewQuery,
  nodeQuery: OverviewQuery,
) => {
  const nodeType = React.useContext(ClusterUtilizationContext);
  return React.useMemo(() => {
    const consumerQueries = getTop25ConsumerQueries(nodeType);
    return [
      {
        query: consumerQueries[nsQuery],
        model: ProjectModel,
        metric: 'namespace',
      },
      {
        query: consumerQueries[podQuery],
        model: PodModel,
        metric: 'pod',
      },
      {
        query: consumerQueries[nodeQuery],
        model: NodeModel,
        metric: 'instance',
      },
    ];
  }, [nodeQuery, nodeType, nsQuery, podQuery]);
};

export const CPUPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(
    OverviewQuery.PROJECTS_BY_CPU,
    OverviewQuery.PODS_BY_CPU,
    OverviewQuery.NODES_BY_CPU,
  );
  return (
    <ConsumerPopover
      title={t('public~CPU')}
      current={current}
      consumers={consumers}
      humanize={humanizeCpuCores}
    />
  );
};

export const MemoryPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(
    OverviewQuery.PROJECTS_BY_MEMORY,
    OverviewQuery.PODS_BY_MEMORY,
    OverviewQuery.NODES_BY_MEMORY,
  );
  return (
    <ConsumerPopover
      title={t('public~Memory')}
      current={current}
      consumers={consumers}
      humanize={humanizeBinaryBytes}
    />
  );
};

export const StoragePopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(
    OverviewQuery.PROJECTS_BY_STORAGE,
    OverviewQuery.PODS_BY_STORAGE,
    OverviewQuery.NODES_BY_STORAGE,
  );
  return (
    <ConsumerPopover
      title={t('public~Filesystem')}
      current={current}
      consumers={consumers}
      humanize={humanizeBinaryBytes}
    />
  );
};

export const PodPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const nodeType = React.useContext(ClusterUtilizationContext);
  const consumers = React.useMemo(() => {
    const consumerQueries = getTop25ConsumerQueries(nodeType);
    return [
      {
        query: consumerQueries[OverviewQuery.PROJECTS_BY_PODS],
        model: ProjectModel,
        metric: 'namespace',
      },
      {
        query: consumerQueries[OverviewQuery.NODES_BY_PODS],
        model: NodeModel,
        metric: 'node',
      },
    ];
  }, [nodeType]);
  return (
    <ConsumerPopover
      title={t('public~Pod count')}
      current={current}
      consumers={consumers}
      humanize={humanizeNumber}
    />
  );
};

export const NetworkInPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(
    OverviewQuery.PROJECTS_BY_NETWORK_IN,
    OverviewQuery.PODS_BY_NETWORK_IN,
    OverviewQuery.NODES_BY_NETWORK_IN,
  );
  return (
    <ConsumerPopover
      title={t('public~Network in')}
      current={current}
      consumers={consumers}
      humanize={humanizeDecimalBytesPerSec}
    />
  );
};

export const NetworkOutPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(
    OverviewQuery.PROJECTS_BY_NETWORK_OUT,
    OverviewQuery.PODS_BY_NETWORK_OUT,
    OverviewQuery.NODES_BY_NETWORK_OUT,
  );
  return (
    <ConsumerPopover
      title={t('public~Network out')}
      current={current}
      consumers={consumers}
      humanize={humanizeDecimalBytesPerSec}
    />
  );
};
