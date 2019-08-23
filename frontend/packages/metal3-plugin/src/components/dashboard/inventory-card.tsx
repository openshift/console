import * as React from 'react';
import * as _ from 'lodash';
import { DashboardItemProps } from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import { InventoryItem } from '@console/internal/components/dashboard/inventory-card/inventory-item';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { MachineModel } from '@console/internal/models';
import { getNamespace } from '@console/shared';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { getHostMachineName } from '../../selectors';
import { getInventoryQueries, HostQuery, getHostQueryResultError } from './queries';

const getResources = (namespace: string, machineName: string): FirehoseResource[] => [
  {
    isList: false,
    namespace,
    name: machineName,
    kind: referenceForModel(MachineModel),
    prop: 'machine',
  },
];

export const InventoryCard: React.FC<InventoryCardProps> = ({
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
  const machineAddresses = _.get(resources.machine, 'data.status.addresses', []);
  const machineIP = _.get(machineAddresses.find((addr) => addr.type === 'InternalIP'), 'address');

  React.useEffect(() => {
    const k8sResources = getResources(namespace, machineName);
    k8sResources.forEach((r) => watchK8sResource(r));
    return () => {
      k8sResources.forEach((r) => stopWatchK8sResource(r));
    };
  }, [watchK8sResource, stopWatchK8sResource, namespace, machineName]);

  React.useEffect(() => {
    if (machineIP) {
      const queries = getInventoryQueries(machineIP);
      Object.keys(queries).forEach((key) => watchPrometheus(queries[key]));
      return () => {
        Object.keys(queries).forEach((key) => stopWatchPrometheusQuery(queries[key]));
      };
    }
    return undefined;
  }, [watchPrometheus, stopWatchPrometheusQuery, machineIP]);

  const queries = getInventoryQueries(machineIP);

  const podResult = prometheusResults.getIn([queries[HostQuery.NUMBER_OF_PODS], 'result']);
  const podError = getHostQueryResultError(podResult);
  const podStats = getInstantVectorStats(podResult);
  const podCount = _.get(podStats, '[0].y');

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Inventory</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <InventoryItem
          isLoading={!podResult}
          singularTitle="Pod"
          pluralTitle="Pods"
          count={podCount}
          error={podError || !podStats.length}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type InventoryCardProps = DashboardItemProps & {
  obj: K8sResourceKind;
};
