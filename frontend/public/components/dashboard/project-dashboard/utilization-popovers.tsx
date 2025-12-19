import type { FC } from 'react';
import { createContext, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TopConsumerPopoverProps } from '@console/dynamic-plugin-sdk';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import {
  ProjectQueries,
  getTopConsumerQueries,
} from '@console/shared/src/promql/project-dashboard';
import { PodModel } from '../../../models';
import {
  humanizeCpuCores,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
} from '../../utils/units';

export const ProjectUtilizationContext = createContext('');

const useConsumers = (query: ProjectQueries) => {
  const namespace = useContext(ProjectUtilizationContext);
  const consumers = useMemo(
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

export const CPUPopover: FC<TopConsumerPopoverProps> = ({ current }) => {
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

export const MemoryPopover: FC<TopConsumerPopoverProps> = ({ current }) => {
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

export const FilesystemPopover: FC<TopConsumerPopoverProps> = ({ current }) => {
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

export const NetworkInPopover: FC<TopConsumerPopoverProps> = ({ current }) => {
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

export const NetworkOutPopover: FC<TopConsumerPopoverProps> = ({ current }) => {
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
