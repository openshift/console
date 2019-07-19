import * as React from 'react';
import * as _ from 'lodash';
import { DashboardItemProps } from '@console/internal/components/dashboards-page/with-dashboard-resources';
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
  humanizePercentage,
} from '@console/internal/components/utils';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { MachineModel } from '@console/internal/models';
import { getNamespace } from '@console/shared';
import { getHostMachineName } from '../../selectors';
import { getUtilizationQueries, HostQuery } from './queries';

const getMachineResource = (namespace: string, name: string): FirehoseResource => ({
  isList: false,
  namespace,
  name,
  kind: referenceForModel(MachineModel),
  prop: 'machine',
});

export const UtilizationCard: React.FC<UtilizationCardProps> = ({
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

  const machineAddresses = _.get(resources.machine, 'data.status.addresses', []);
  const machineIP = _.get(machineAddresses.find((addr) => addr.type === 'InternalIP'), 'address');

  React.useEffect(() => {
    if (machineIP) {
      const queries = getUtilizationQueries(machineIP);
      Object.keys(queries).forEach((key) => watchPrometheus(queries[key]));
      return () => {
        Object.keys(queries).forEach((key) => stopWatchPrometheusQuery(queries[key]));
      };
    }
    return undefined;
  }, [watchPrometheus, stopWatchPrometheusQuery, machineIP]);

  const queries = getUtilizationQueries(machineIP);
  const cpuUtilization = prometheusResults.getIn([queries[HostQuery.CPU_UTILIZATION], 'result']);
  const memoryUtilization = prometheusResults.getIn([
    queries[HostQuery.MEMORY_UTILIZATION],
    'result',
  ]);
  const storageUtilization = prometheusResults.getIn([
    queries[HostQuery.STORAGE_UTILIZATION],
    'result',
  ]);
  const networkInUtilization = prometheusResults.getIn([
    queries[HostQuery.NETWORK_IN_UTILIZATION],
    'result',
  ]);
  const networkOutUtilization = prometheusResults.getIn([
    queries[HostQuery.NETWORK_OUT_UTILIZATION],
    'result',
  ]);
  const numberOfPods = prometheusResults.getIn([queries[HostQuery.NUMBER_OF_PODS], 'result']);

  const cpuStats = getRangeVectorStats(cpuUtilization);
  const memoryStats = getRangeVectorStats(memoryUtilization);
  const storageStats = getRangeVectorStats(storageUtilization);
  const networkInStats = getRangeVectorStats(networkInUtilization);
  const networkOutStats = getRangeVectorStats(networkOutUtilization);
  const numberOfPodsStats = getRangeVectorStats(numberOfPods);

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
            isLoading={!cpuUtilization}
            humanizeValue={humanizePercentage}
            query={queries[HostQuery.CPU_UTILIZATION]}
          />
          <UtilizationItem
            title="Memory usage"
            data={memoryStats}
            isLoading={!memoryUtilization}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[HostQuery.MEMORY_UTILIZATION]}
          />
          <UtilizationItem
            title="Number of pods"
            data={numberOfPodsStats}
            isLoading={!numberOfPods}
            humanizeValue={(v) => ({ string: `${v}`, value: v as number, unit: '' })}
            query={queries[HostQuery.NUMBER_OF_PODS]}
          />
          <UtilizationItem
            title="Network In"
            data={networkInStats}
            isLoading={!networkInUtilization}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[HostQuery.NETWORK_IN_UTILIZATION]}
          />
          <UtilizationItem
            title="Network Out"
            data={networkOutStats}
            isLoading={!networkOutUtilization}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[HostQuery.NETWORK_OUT_UTILIZATION]}
          />
          <UtilizationItem
            title="Filesystem"
            data={storageStats}
            isLoading={!storageUtilization}
            humanizeValue={humanizeBinaryBytesWithoutB}
            query={queries[HostQuery.STORAGE_UTILIZATION]}
          />
        </UtilizationBody>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type UtilizationCardProps = DashboardItemProps & {
  obj: K8sResourceKind;
};
