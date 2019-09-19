import * as React from 'react';
import * as _ from 'lodash';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboards-page/with-dashboard-resources';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '@console/internal/components/dashboard/dashboard-card';
import {
  UtilizationBody,
  UtilizationItem,
} from '@console/internal/components/dashboard/utilization-card';
import { getRangeVectorStats } from '@console/internal/components/graphs/utils';
import {
  FirehoseResource,
  humanizeBinaryBytesWithoutB,
  humanizeCpuCores,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { MachineModel } from '@console/internal/models';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getNamespace, getMachineNodeName, getMachineInternalIP } from '@console/shared';
import { getHostMachineName } from '../../selectors';
import { getUtilizationQueries, HostQuery } from './queries';

const getMachineResource = (namespace: string, name: string): FirehoseResource => ({
  isList: false,
  namespace,
  name,
  kind: referenceForModel(MachineModel),
  prop: 'machine',
});

const UtilizationCard: React.FC<UtilizationCardProps> = ({
  obj,
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const namespace = getNamespace(obj);
  const machineName = getHostMachineName(obj);

  React.useEffect(() => {
    const machineResource = getMachineResource(namespace, machineName);
    watchK8sResource(machineResource);
    return () => stopWatchK8sResource(machineResource);
  }, [watchK8sResource, stopWatchK8sResource, namespace, machineName]);

  const machineLoaded = _.get(resources.machine, 'loaded');
  const machineLoadError = _.get(resources.machine, 'loadError');
  const machine = _.get(resources.machine, 'data', null);

  const hostName = getMachineNodeName(machine);
  const hostIP = getMachineInternalIP(machine);

  React.useEffect(() => {
    if (machineName) {
      const queries = getUtilizationQueries(hostName, hostIP);
      Object.keys(queries).forEach((key) => watchPrometheus(queries[key]));
      return () => {
        Object.keys(queries).forEach((key) => stopWatchPrometheusQuery(queries[key]));
      };
    }
    return undefined;
  }, [watchPrometheus, stopWatchPrometheusQuery, machineName, hostName, hostIP]);

  const queries = getUtilizationQueries(hostName, hostIP);
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
  const storageUtilization = prometheusResults.getIn([
    queries[HostQuery.STORAGE_UTILIZATION],
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
  const storageStats = getRangeVectorStats(storageUtilization);
  const networkInStats = getRangeVectorStats(networkInUtilization);
  const networkOutStats = getRangeVectorStats(networkOutUtilization);
  const numberOfPodsStats = getRangeVectorStats(numberOfPods);

  const itemIsLoading = (prometheusResult) =>
    !machineLoadError && (machineLoaded ? (machine ? !prometheusResult : false) : true);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Utilization</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <UtilizationBody timestamps={cpuStats.map((stat) => stat.x as Date)}>
          <UtilizationItem
            title="CPU usage"
            data={cpuStats}
            error={cpuUtilizationError}
            isLoading={itemIsLoading(cpuUtilization)}
            humanizeValue={humanizeCpuCores}
            query={queries[HostQuery.CPU_UTILIZATION]}
          />
          <UtilizationItem
            title="Memory usage"
            data={memoryStats}
            error={memoryUtilizationError}
            isLoading={itemIsLoading(memoryUtilization)}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[HostQuery.MEMORY_UTILIZATION]}
          />
          <UtilizationItem
            title="Number of pods"
            data={numberOfPodsStats}
            error={numberOfPodsError}
            isLoading={itemIsLoading(numberOfPods)}
            humanizeValue={(v) => ({ string: `${v}`, value: v as number, unit: '' })}
            query={queries[HostQuery.NUMBER_OF_PODS]}
          />
          <UtilizationItem
            title="Network In"
            data={networkInStats}
            error={networkInUtilizationError}
            isLoading={itemIsLoading(networkInUtilization)}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[HostQuery.NETWORK_IN_UTILIZATION]}
          />
          <UtilizationItem
            title="Network Out"
            data={networkOutStats}
            error={networkOutUtilizationError}
            isLoading={itemIsLoading(networkOutUtilization)}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[HostQuery.NETWORK_OUT_UTILIZATION]}
          />
          <UtilizationItem
            title="Filesystem"
            data={storageStats}
            error={storageUtilizationError}
            isLoading={itemIsLoading(storageUtilization)}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[HostQuery.STORAGE_UTILIZATION]}
          />
        </UtilizationBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(UtilizationCard);

type UtilizationCardProps = DashboardItemProps & {
  obj: K8sResourceKind;
};
