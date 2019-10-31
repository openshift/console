import * as React from 'react';
import * as _ from 'lodash';
import {
  DashboardItemProps,
  withDashboardResources,
} from '@console/internal/components/dashboard/with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import InventoryItem from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { MachineModel } from '@console/internal/models';
import { getNamespace, getMachineInternalIP } from '@console/shared';
import { getInstantVectorStats } from '@console/internal/components/graphs/utils';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { getHostMachineName } from '../../../selectors';
import { BareMetalHostKind } from '../../../types';
import { getInventoryQueries, HostQuery, getHostQueryResultError } from './queries';
import { BareMetalHostDashboardContext } from './BareMetalHostDashboardContext';

const getResources = (namespace: string, machineName: string): FirehoseResource[] => [
  {
    isList: false,
    namespace,
    name: machineName,
    kind: referenceForModel(MachineModel),
    prop: 'machine',
  },
];

const InventoryCard: React.FC<InventoryCardProps> = ({
  watchPrometheus,
  stopWatchPrometheusQuery,
  prometheusResults,
  watchK8sResource,
  stopWatchK8sResource,
  resources,
}) => {
  const { obj } = React.useContext(BareMetalHostDashboardContext);

  const namespace = getNamespace(obj);
  const machineName = getHostMachineName(obj);
  const machine = _.get(resources.machine, 'data', null);
  const hostIP = getMachineInternalIP(machine);

  React.useEffect(() => {
    const k8sResources = getResources(namespace, machineName);
    k8sResources.forEach((r) => watchK8sResource(r));
    return () => {
      k8sResources.forEach((r) => stopWatchK8sResource(r));
    };
  }, [watchK8sResource, stopWatchK8sResource, namespace, machineName]);

  React.useEffect(() => {
    if (hostIP) {
      const queries = getInventoryQueries(hostIP);
      Object.keys(queries).forEach((key) => watchPrometheus(queries[key]));
      return () => {
        Object.keys(queries).forEach((key) => stopWatchPrometheusQuery(queries[key]));
      };
    }
    return undefined;
  }, [watchPrometheus, stopWatchPrometheusQuery, hostIP]);

  const queries = getInventoryQueries(hostIP);

  const podData = prometheusResults.getIn([
    queries[HostQuery.NUMBER_OF_PODS],
    'data',
  ]) as PrometheusResponse;
  const podQueryError = prometheusResults.getIn([queries[HostQuery.NUMBER_OF_PODS], 'loadError']);
  const podError = getHostQueryResultError(podData);
  const podStats = getInstantVectorStats(podData);
  const podCount = _.get(podStats, '[0].y');

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Inventory</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <InventoryItem
          isLoading={!podData}
          title="Pod"
          count={podCount}
          error={podQueryError || podError || !podStats.length}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

export default withDashboardResources(InventoryCard);

type InventoryCardProps = DashboardItemProps & {
  obj: BareMetalHostKind;
};
