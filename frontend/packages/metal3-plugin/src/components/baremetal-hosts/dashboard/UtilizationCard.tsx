import * as React from 'react';
import { useTranslation } from 'react-i18next';
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
import { getMachineNodeName, DEFAULT_DURATION, useDateRange } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  PrometheusUtilizationItem,
  PrometheusMultilineUtilizationItem,
} from '@console/internal/components/dashboard/dashboards-page/cluster-dashboard/utilization-card';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';
import {
  getUtilizationQueries,
  HostQuery,
  getTopConsumerQueries,
  getMultilineUtilizationQueries,
} from './queries';
import { UtilizationDurationDropdown } from '@console/shared/src/components/dashboard/utilization-card/UtilizationDurationDropdown';

const UtilizationCard: React.FC = () => {
  const { t } = useTranslation();
  const [duration, setDuration] = React.useState(DEFAULT_DURATION);
  const [startDate, endDate, updateEndDate] = useDateRange(duration);

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
          title={t('metal3-plugin~CPU')}
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
    [nodeName, t],
  );

  const memPopover = React.useCallback(
    ({ current }) => {
      const topConsumerQueries = getTopConsumerQueries(nodeName);
      return (
        <ConsumerPopover
          title={t('metal3-plugin~Memory')}
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
    [nodeName, t],
  );

  const storagePopover = React.useCallback(
    ({ current }) => {
      const topConsumerQueries = getTopConsumerQueries(nodeName);
      return (
        <ConsumerPopover
          title={t('metal3-plugin~Disk Usage')}
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
    [nodeName, t],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>{t('metal3-plugin~Utilization')}</DashboardCardTitle>
        <UtilizationDurationDropdown onChange={setDuration} />
      </DashboardCardHeader>
      <UtilizationBody startDate={startDate} endDate={endDate}>
        <PrometheusUtilizationItem
          title={t('metal3-plugin~CPU')}
          utilizationQuery={queries[HostQuery.CPU_UTILIZATION].utilization}
          humanizeValue={humanizeCpuCores}
          TopConsumerPopover={cpuPopover}
          duration={duration}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('metal3-plugin~Memory')}
          utilizationQuery={queries[HostQuery.MEMORY_UTILIZATION].utilization}
          totalQuery={queries[HostQuery.MEMORY_UTILIZATION].total}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={memPopover}
          duration={duration}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('metal3-plugin~Filesystem')}
          utilizationQuery={queries[HostQuery.STORAGE_UTILIZATION].utilization}
          totalQuery={queries[HostQuery.STORAGE_UTILIZATION].total}
          humanizeValue={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          TopConsumerPopover={storagePopover}
          duration={duration}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusMultilineUtilizationItem
          title={t('metal3-plugin~Network Transfer')}
          queries={multilineQueries[HostQuery.NETWORK_UTILIZATION]}
          humanizeValue={humanizeDecimalBytesPerSec}
          duration={duration}
          startDate={startDate}
          endDate={endDate}
          updateEndDate={updateEndDate}
        />
        <PrometheusUtilizationItem
          title={t('metal3-plugin~Pod count')}
          utilizationQuery={queries[HostQuery.NUMBER_OF_PODS].utilization}
          humanizeValue={humanizePods}
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
