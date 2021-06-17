import * as React from 'react';
import { useTranslation } from 'react-i18next';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import { TopConsumerPopoverProp } from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import { getName } from '@console/shared';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import { PopoverPosition } from '@patternfly/react-core';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
  humanizeNumber,
} from '../../utils';
import { ProjectDashboardContext } from './project-dashboard-context';
import { PodModel } from '../../../models';
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
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';

export const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const { obj } = React.useContext(ProjectDashboardContext);
  const projectName = getName(obj);
  const queries = React.useMemo(() => getUtilizationQueries(projectName), [projectName]);
  const multilineQueries = React.useMemo(() => getMultilineQueries(projectName), [projectName]);

  const cpuPopover = React.useCallback(
    React.memo<TopConsumerPopoverProp>(({ current }) => (
      <ConsumerPopover
        title={t('public~CPU')}
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
        title={t('public~Memory')}
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
        title={t('public~Filesystem')}
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
        title={t('public~Network in')}
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
        title={t('public~Network out')}
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
        <DashboardCardTitle>{t('public~Utilization')}</DashboardCardTitle>
        <UtilizationDurationDropdown />
      </DashboardCardHeader>
      <UtilizationBody>
        <PrometheusUtilizationItem
          title={t('public~CPU')}
          humanizeValue={humanizeCpuCores}
          utilizationQuery={queries[ProjectQueries.CPU_USAGE]}
          requestQuery={queries[ProjectQueries.CPU_REQUESTS]}
          TopConsumerPopover={cpuPopover}
          namespace={projectName}
        />
        <PrometheusUtilizationItem
          title={t('public~Memory')}
          humanizeValue={humanizeBinaryBytes}
          utilizationQuery={queries[ProjectQueries.MEMORY_USAGE]}
          requestQuery={queries[ProjectQueries.MEMORY_REQUESTS]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={memPopover}
          namespace={projectName}
        />
        <PrometheusUtilizationItem
          title={t('public~Filesystem')}
          humanizeValue={humanizeBinaryBytes}
          utilizationQuery={queries[ProjectQueries.FILESYSTEM_USAGE]}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={filesystemPopover}
          namespace={projectName}
        />
        <PrometheusMultilineUtilizationItem
          title={t('public~Network transfer')}
          humanizeValue={humanizeDecimalBytesPerSec}
          queries={multilineQueries[ProjectQueries.NETWORK_UTILIZATION]}
          TopConsumerPopovers={networkPopovers}
          namespace={projectName}
        />
        <PrometheusUtilizationItem
          title={t('public~Pod count')}
          humanizeValue={humanizeNumber}
          utilizationQuery={queries[ProjectQueries.POD_COUNT]}
          namespace={projectName}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};
