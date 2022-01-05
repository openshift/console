import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TopConsumerPopoverProps } from '@console/dynamic-plugin-sdk';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import {
  ProjectQueries,
  getTopConsumerQueries,
} from '@console/shared/src/promql/project-dashboard';
import { PodModel } from '../../../models';
import { humanizeCpuCores, humanizeBinaryBytes, humanizeDecimalBytesPerSec } from '../../utils';

export const ProjectUtilizationContext = React.createContext('');

const useConsumers = (query: ProjectQueries) => {
  const namespace = React.useContext(ProjectUtilizationContext);
  const consumers = React.useMemo(
    () => [
      {
        query: getTopConsumerQueries(namespace)[query],
        model: PodModel,
        metric: 'pod',
      },
    ],
    [query, namespace],
  );
  return {
    consumers,
    namespace,
  };
};

export const CPUPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(ProjectQueries.PODS_BY_CPU);
  return (
    <ConsumerPopover
      title={t('public~CPU')}
      current={current}
      humanize={humanizeCpuCores}
      {...consumers}
    />
  );
};

export const MemoryPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(ProjectQueries.PODS_BY_MEMORY);
  return (
    <ConsumerPopover
      title={t('public~Memory')}
      current={current}
      humanize={humanizeBinaryBytes}
      {...consumers}
    />
  );
};

export const FilesystemPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(ProjectQueries.PODS_BY_FILESYSTEM);
  return (
    <ConsumerPopover
      title={t('public~Filesystem')}
      current={current}
      humanize={humanizeBinaryBytes}
      {...consumers}
    />
  );
};

export const NetworkInPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(ProjectQueries.PODS_BY_NETWORK_IN);
  return (
    <ConsumerPopover
      title={t('public~Network in')}
      current={current}
      humanize={humanizeDecimalBytesPerSec}
      {...consumers}
    />
  );
};

export const NetworkOutPopover: React.FC<TopConsumerPopoverProps> = ({ current }) => {
  const { t } = useTranslation();
  const consumers = useConsumers(ProjectQueries.PODS_BY_NETWORK_OUT);
  return (
    <ConsumerPopover
      title={t('public~Network out')}
      current={current}
      humanize={humanizeDecimalBytesPerSec}
      {...consumers}
    />
  );
};
