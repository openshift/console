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
import { humanizeBinaryBytesWithoutB, humanizeCpuCores } from '@console/internal/components/utils';
import { MachineKind } from '@console/internal/module/k8s';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getMachineNodeName, getMachineInternalIP } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { BareMetalHostKind } from '../../../types';
import { getUtilizationQueries, HostQuery } from './queries';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const metricDurations = [ONE_HR, SIX_HR, TWENTY_FOUR_HR];
const metricDurationsOptions = _.zipObject(metricDurations, metricDurations);

const UtilizationCard: React.FC<UtilizationCardProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
}) => {
  const [duration, setDuration] = React.useState(metricDurations[0]);

  const { machine } = React.useContext(BareMetalHostDashboardContext);
  const hostName = getMachineNodeName(machine);
  const hostIP = getMachineInternalIP(machine);

  const queries = React.useMemo(
    () => getUtilizationQueries(hostName, hostIP, UTILIZATION_QUERY_HOUR_MAP[duration]),
    [hostName, hostIP, duration],
  );

  React.useEffect(() => {
    if (machine) {
      Object.keys(queries).forEach((key) => watchPrometheus(queries[key]));
      return () => {
        Object.keys(queries).forEach((key) => stopWatchPrometheusQuery(queries[key]));
      };
    }
    return undefined;
  }, [watchPrometheus, stopWatchPrometheusQuery, queries, machine]);

  const cpuUtilization = prometheusResults.getIn([
    queries[HostQuery.CPU_UTILIZATION],
    'data',
  ]) as PrometheusResponse;
  const cpuUtilizationError = prometheusResults.getIn([
    queries[HostQuery.CPU_UTILIZATION],
    'loadError',
  ]);
  const memoryUtilization = prometheusResults.getIn([
    queries[HostQuery.MEMORY_UTILIZATION],
    'data',
  ]) as PrometheusResponse;
  const memoryUtilizationError = prometheusResults.getIn([
    queries[HostQuery.MEMORY_UTILIZATION],
    'loadError',
  ]);
  const memoryTotal = prometheusResults.getIn([queries[HostQuery.MEMORY_TOTAL], 'data']);
  const storageUtilization = prometheusResults.getIn([
    queries[HostQuery.STORAGE_UTILIZATION],
    'data',
  ]) as PrometheusResponse;
  const storageTotal = prometheusResults.getIn([
    queries[HostQuery.STORAGE_TOTAL],
    'data',
  ]) as PrometheusResponse;
  const storageUtilizationError = prometheusResults.getIn([
    queries[HostQuery.STORAGE_UTILIZATION],
    'loadError',
  ]);
  const networkInUtilization = prometheusResults.getIn([
    queries[HostQuery.NETWORK_IN_UTILIZATION],
    'data',
  ]) as PrometheusResponse;
  const networkInUtilizationError = prometheusResults.getIn([
    queries[HostQuery.NETWORK_IN_UTILIZATION],
    'loadError',
  ]);
  const networkOutUtilization = prometheusResults.getIn([
    queries[HostQuery.NETWORK_OUT_UTILIZATION],
    'data',
  ]) as PrometheusResponse;
  const networkOutUtilizationError = prometheusResults.getIn([
    queries[HostQuery.NETWORK_OUT_UTILIZATION],
    'loadError',
  ]);
  const numberOfPods = prometheusResults.getIn([
    queries[HostQuery.NUMBER_OF_PODS],
    'data',
  ]) as PrometheusResponse;
  const numberOfPodsError = prometheusResults.getIn([
    queries[HostQuery.NUMBER_OF_PODS],
    'loadError',
  ]);

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
          query={queries[HostQuery.CPU_UTILIZATION]}
        />
        <UtilizationItem
          title="Memory usage"
          data={memoryStats}
          error={memoryUtilizationError}
          isLoading={!memoryUtilization}
          humanizeValue={humanizeBinaryBytesWithoutB}
          query={queries[HostQuery.MEMORY_UTILIZATION]}
          max={memoryTotalValue}
          byteDataType={ByteDataTypes.BinaryBytesWithoutB}
        />
        <UtilizationItem
          title="Number of pods"
          data={numberOfPodsStats}
          error={numberOfPodsError}
          isLoading={!numberOfPods}
          humanizeValue={(v) => ({ string: `${v}`, value: v as number, unit: '' })}
          query={queries[HostQuery.NUMBER_OF_PODS]}
        />
        <UtilizationItem
          title="Network In"
          data={networkInStats}
          error={networkInUtilizationError}
          isLoading={!networkInUtilization}
          humanizeValue={humanizeBinaryBytesWithoutB}
          query={queries[HostQuery.NETWORK_IN_UTILIZATION]}
          byteDataType={ByteDataTypes.BinaryBytesWithoutB}
        />
        <UtilizationItem
          title="Network Out"
          data={networkOutStats}
          error={networkOutUtilizationError}
          isLoading={!networkOutUtilization}
          humanizeValue={humanizeBinaryBytesWithoutB}
          query={queries[HostQuery.NETWORK_OUT_UTILIZATION]}
          byteDataType={ByteDataTypes.BinaryBytesWithoutB}
        />
        <UtilizationItem
          title="Filesystem"
          data={storageStats}
          error={storageUtilizationError}
          isLoading={!storageUtilization}
          humanizeValue={humanizeBinaryBytesWithoutB}
          query={queries[HostQuery.STORAGE_UTILIZATION]}
          max={storageTotalValue}
          byteDataType={ByteDataTypes.BinaryBytesWithoutB}
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
