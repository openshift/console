import * as React from 'react';
import * as _ from 'lodash';
import { DashboardItemProps } from '@console/internal/components/dashboards-page/with-dashboard-resources';
import { DashboardCard } from '@console/internal/components/dashboard/dashboard-card';
import { DashboardCardBody } from '@console/internal/components/dashboard/dashboard-card/card-body';
import { DashboardCardHeader } from '@console/internal/components/dashboard/dashboard-card/card-header';
import { DashboardCardTitle } from '@console/internal/components/dashboard/dashboard-card/card-title';
import {
  InventoryItem,
  Status,
} from '@console/internal/components/dashboard/inventory-card/inventory-item';
import { InventoryStatusGroup } from '@console/internal/components/dashboard/inventory-card/status-group';
import { K8sResourceKind, referenceForModel } from '@console/internal/module/k8s';
import { FirehoseResource } from '@console/internal/components/utils';
import { MachineModel } from '@console/internal/models';
import { getNamespace } from '@console/shared';
import { getHostStorage, getHostNICs, getHostCPU, getHostMachineName } from '../../selectors';
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

  const diskCount = getHostStorage(obj).length;
  const nicCount = getHostNICs(obj).length;
  const cpuCount = getHostCPU(obj).count || 0;

  const queries = getInventoryQueries(machineIP);

  const podResult = prometheusResults.getIn([queries[HostQuery.NUMBER_OF_PODS], 'result']);
  const podError = getHostQueryResultError(podResult);
  const podCount = _.get(podResult, 'data.result', []).length;

  const fanResult = prometheusResults.getIn([queries[HostQuery.NUMBER_OF_FANS], 'result']);
  const fanError = getHostQueryResultError(fanResult);
  const fans = _.get(fanResult, 'data.result', []);
  const fanCount = fans.length;
  const fanNotOkCount = fans.filter((el) => el.metric.status !== 'ok').length;

  const psuResult = prometheusResults.getIn([queries[HostQuery.NUMBER_OF_PSUS], 'result']);
  const psuError = getHostQueryResultError(psuResult);
  const psus = _.get(psuResult, 'data.result', []);
  const psuCount = psus.length;
  const psuNotOkCount = psus.filter((el) => el.metric.status !== 'ok').length;

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
          error={podError}
        />

        <InventoryItem
          isLoading={false}
          singularTitle="Disk"
          pluralTitle="Disks"
          count={diskCount}
          link="disks"
          error={null}
        />

        <InventoryItem
          isLoading={false}
          singularTitle="NIC"
          pluralTitle="NICs"
          count={nicCount}
          link="nics"
          error={null}
        />
        <InventoryItem
          isLoading={false}
          singularTitle="CPU"
          pluralTitle="CPUs"
          count={cpuCount}
          error={null}
        />

        <InventoryItem
          isLoading={!fanResult}
          singularTitle="Fan"
          pluralTitle="Fans"
          count={fanCount}
          error={fanError}
        >
          <Status groupID={InventoryStatusGroup.OK} count={fanCount - fanNotOkCount} />
          <Status groupID={InventoryStatusGroup.ERROR} count={fanNotOkCount} />
        </InventoryItem>

        <InventoryItem
          isLoading={!psuResult}
          singularTitle="PSU"
          pluralTitle="PSUs"
          count={psuCount}
          error={psuError}
        >
          <Status groupID={InventoryStatusGroup.OK} count={psuCount - psuNotOkCount} />
          <Status groupID={InventoryStatusGroup.ERROR} count={psuNotOkCount} />
        </InventoryItem>
      </DashboardCardBody>
    </DashboardCard>
  );
};

type InventoryCardProps = DashboardItemProps & {
  obj: K8sResourceKind;
};
