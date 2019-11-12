import * as React from 'react';
import * as _ from 'lodash';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import { Dropdown } from '@console/internal/components/utils/dropdown';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import UtilizationBody from '@console/shared/src/components/dashboard/utilization-card/UtilizationBody';
import UtilizationItem from '@console/shared/src/components/dashboard/utilization-card/UtilizationItem';
import {
  getRangeVectorStats,
  getInstantVectorStats,
} from '@console/internal/components/graphs/utils';
import {
  ONE_HR,
  SIX_HR,
  TWENTY_FOUR_HR,
  UTILIZATION_QUERY_HOUR_MAP,
} from '@console/shared/src/components/dashboard/utilization-card/dropdown-value';
import { PodModel, ProjectModel } from '@console/internal/models';
import ConsumerPopover from '@console/shared/src/components/dashboard/utilization-card/TopConsumerPopover';
import {
  humanizeBinaryBytesWithoutB,
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeSeconds,
  secondsToNanoSeconds,
  Humanize,
} from '@console/internal/components/utils';
import { MachineKind } from '@console/internal/module/k8s';
import { getMachineNodeName, getMachineInternalIP } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { getPrometheusQueryResponse } from '@console/internal/actions/dashboards';
import { BareMetalHostKind } from '../../../types';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';
import { getUtilizationQueries, HostQuery, getTopConsumerQueries } from './queries';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);
const humanizeFromSeconds: Humanize = (value) => humanizeSeconds(secondsToNanoSeconds(value));

const UtilizationCard: React.FC<UtilizationCardProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [duration, setDuration] = React.useState(metricDurations[0]);

  const { machine } = React.useContext(BareMetalHostDashboardContext);
  const hostName = getMachineNodeName(machine);
  const hostIP = getMachineInternalIP(machine);

  const queries = React.useMemo(() => getUtilizationQueries(hostName, hostIP), [hostName, hostIP]);

  React.useEffect(() => {
    if (machine) {
      Object.keys(queries).forEach((key) => {
        watchPrometheus(queries[key].utilization, null, UTILIZATION_QUERY_HOUR_MAP[duration]);
        if (queries[key].total) {
          watchPrometheus(queries[key].total);
        }
      });
      return () => {
        Object.keys(queries).forEach((key) => {
          stopWatchPrometheusQuery(queries[key].utilization, UTILIZATION_QUERY_HOUR_MAP[duration]);
          if (queries[key].total) {
            stopWatchPrometheusQuery(queries[key].total);
          }
        });
      };
    }
    return undefined;
  }, [watchPrometheus, stopWatchPrometheusQuery, queries, machine, duration]);

  const [cpuUtilization, cpuUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[HostQuery.CPU_UTILIZATION].utilization,
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [memoryUtilization, memoryUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[HostQuery.MEMORY_UTILIZATION].utilization,
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [memoryTotal, memoryTotalError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[HostQuery.MEMORY_UTILIZATION].total,
  );
  const [storageUtilization, storageUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[HostQuery.STORAGE_UTILIZATION].utilization,
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [storageTotal, storageTotalError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[HostQuery.STORAGE_UTILIZATION].total,
  );
  const [networkInUtilization, networkInUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[HostQuery.NETWORK_IN_UTILIZATION].utilization,
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [networkOutUtilization, networkOutUtilizationError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[HostQuery.NETWORK_OUT_UTILIZATION].utilization,
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );
  const [numberOfPods, numberOfPodsError] = getPrometheusQueryResponse(
    prometheusResults,
    queries[HostQuery.NUMBER_OF_PODS].utilization,
    UTILIZATION_QUERY_HOUR_MAP[duration],
  );

  const cpuStats = getRangeVectorStats(cpuUtilization);
  const memoryStats = getRangeVectorStats(memoryUtilization);
  const memoryTotalStats = getInstantVectorStats(memoryTotal);
  const storageStats = getRangeVectorStats(storageUtilization);
  const storageTotalStats = getInstantVectorStats(storageTotal);
  const networkInStats = getRangeVectorStats(networkInUtilization);
  const networkOutStats = getRangeVectorStats(networkOutUtilization);
  const numberOfPodsStats = getRangeVectorStats(numberOfPods);

  const memoryTotalValue = memoryTotalStats.length ? memoryTotalStats[0].y : null;
  const storageTotalValue = storageTotalStats.length ? storageTotalStats[0].y : null;

  const cpuPopover = React.useCallback(
    ({ current }) => {
      const topConsumerQueries = getTopConsumerQueries(hostName, hostIP);
      return (
        <ConsumerPopover
          title="CPU"
          current={current}
          humanize={humanizeFromSeconds}
          consumers={[
            {
              query: topConsumerQueries[HostQuery.PODS_BY_CPU],
              model: PodModel,
              metric: 'pod',
            },
            {
              query: topConsumerQueries[HostQuery.PROJECTS_BY_CPU],
              model: ProjectModel,
              metric: 'namespace',
            },
          ]}
        />
      );
    },
    [hostIP, hostName],
  );

  const memPopover = React.useCallback(
    ({ current }) => {
      const topConsumerQueries = getTopConsumerQueries(hostName, hostIP);
      return (
        <ConsumerPopover
          title="Memory"
          current={current}
          humanize={humanizeBinaryBytes}
          consumers={[
            {
              query: topConsumerQueries[HostQuery.PODS_BY_MEMORY],
              model: PodModel,
              metric: 'pod',
            },
            {
              query: topConsumerQueries[HostQuery.PROJECTS_BY_MEMORY],
              model: ProjectModel,
              metric: 'namespace',
            },
          ]}
        />
      );
    },
    [hostIP, hostName],
  );

  const storagePopover = React.useCallback(
    ({ current }) => {
      const topConsumerQueries = getTopConsumerQueries(hostName, hostIP);
      return (
        <ConsumerPopover
          title="Disk Usage"
          current={current}
          humanize={humanizeBinaryBytes}
          consumers={[
            {
              query: topConsumerQueries[HostQuery.PODS_BY_STORAGE],
              model: PodModel,
              metric: 'pod',
            },
            {
              query: topConsumerQueries[HostQuery.PROJECTS_BY_STORAGE],
              model: ProjectModel,
              metric: 'namespace',
            },
          ]}
        />
      );
    },
    [hostIP, hostName],
  );

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Utilization</DashboardCardTitle>
        <Dropdown
          items={metricDurationsOptions}
          onChange={setDuration}
          selectedKey={duration}
          title={duration}
        />
      </DashboardCardHeader>
      <UtilizationBody timestamps={cpuStats.map((stat) => stat.x as Date)}>
        <UtilizationItem
          title="CPU usage"
          data={cpuStats}
          error={cpuUtilizationError}
          isLoading={!cpuUtilization}
          humanizeValue={humanizeCpuCores}
          query={queries[HostQuery.CPU_UTILIZATION].utilization}
          TopConsumerPopover={cpuPopover}
        />
        <UtilizationItem
          title="Memory usage"
          data={memoryStats}
          error={memoryUtilizationError || memoryTotalError}
          isLoading={!memoryUtilization || !memoryTotal}
          humanizeValue={humanizeBinaryBytesWithoutB}
          query={queries[HostQuery.MEMORY_UTILIZATION].utilization}
          max={memoryTotalValue}
          byteDataType={ByteDataTypes.BinaryBytesWithoutB}
          TopConsumerPopover={memPopover}
        />
        <UtilizationItem
          title="Number of pods"
          data={numberOfPodsStats}
          error={numberOfPodsError}
          isLoading={!numberOfPods}
          humanizeValue={(v) => ({ string: `${v}`, value: v as number, unit: '' })}
          query={queries[HostQuery.NUMBER_OF_PODS].utilization}
        />
        <UtilizationItem
          title="Network In"
          data={networkInStats}
          error={networkInUtilizationError}
          isLoading={!networkInUtilization}
          humanizeValue={humanizeBinaryBytesWithoutB}
          query={queries[HostQuery.NETWORK_IN_UTILIZATION].utilization}
          byteDataType={ByteDataTypes.BinaryBytesWithoutB}
        />
        <UtilizationItem
          title="Network Out"
          data={networkOutStats}
          error={networkOutUtilizationError}
          isLoading={!networkOutUtilization}
          humanizeValue={humanizeBinaryBytesWithoutB}
          query={queries[HostQuery.NETWORK_OUT_UTILIZATION].utilization}
          byteDataType={ByteDataTypes.BinaryBytesWithoutB}
        />
        <UtilizationItem
          title="Filesystem"
          data={storageStats}
          error={storageUtilizationError || storageTotalError}
          isLoading={!storageUtilization || !storageTotal}
          humanizeValue={humanizeBinaryBytes}
          query={queries[HostQuery.STORAGE_UTILIZATION].utilization}
          max={storageTotalValue}
          byteDataType={ByteDataTypes.BinaryBytesWithoutB}
          TopConsumerPopover={storagePopover}
        />
      </UtilizationBody>
    </DashboardCard>
  );
};

export default withDashboardResources(UtilizationCard);

type UtilizationCardProps = DashboardItemProps & {
  obj: BareMetalHostKind;
  machine: MachineKind;
};
