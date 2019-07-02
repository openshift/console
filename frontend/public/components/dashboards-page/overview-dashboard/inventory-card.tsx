import * as React from 'react';
import * as _ from 'lodash-es';

import * as plugins from '../../../plugins';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '../../dashboard/dashboard-card';
import { InventoryItem } from '../../dashboard/inventory-card/inventory-item';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { PodModel, NodeModel, PersistentVolumeClaimModel } from '../../../models';
import { K8sResourceKind, PodKind } from '../../../module/k8s';
import { getPodStatusGroups, getNodeStatusGroups, getPVCStatusGroups } from '../../dashboard/inventory-card/utils';
import { FirehoseResource } from '../../utils';

const k8sResources: FirehoseResource[] = [
  {
    isList: true,
    kind: PodModel.kind,
    prop: 'pods',
  },
  {
    isList: true,
    kind: NodeModel.kind,
    prop: 'nodes',
  },
  {
    isList: true,
    kind: PersistentVolumeClaimModel.kind,
    prop: 'pvcs',
  },
];

const uniqueResource = (resource: FirehoseResource, index: number): FirehoseResource => ({
  ...resource,
  prop: `${index}-${resource.prop}`,
});

const getResourcesToWatch = (): FirehoseResource[] => {
  const allResources = [...k8sResources];
  const pluginItems = plugins.registry.getDashboardsOverviewInventoryItems();
  pluginItems.forEach((item, index) => {
    allResources.push(uniqueResource(item.properties.resource, index));
    if (item.properties.additionalResources) {
      item.properties.additionalResources.forEach(ar => allResources.push(uniqueResource(ar, index)));
    }
  });
  return allResources;
};

const InventoryCard_: React.FC<DashboardItemProps> = ({ watchK8sResource, stopWatchK8sResource, resources }) => {
  React.useEffect(() => {
    const resourcesToWatch = getResourcesToWatch();
    resourcesToWatch.forEach(r => watchK8sResource(r));
    return () => {
      resourcesToWatch.forEach(r => stopWatchK8sResource(r));
    };
  }, [watchK8sResource, stopWatchK8sResource]);

  const nodes = _.get(resources, 'nodes');
  const nodesLoaded = _.get(nodes, 'loaded');
  const nodesData = _.get(nodes, 'data', []) as K8sResourceKind[];

  const pods = _.get(resources, 'pods');
  const podsLoaded = _.get(pods, 'loaded');
  const podsData = _.get(pods, 'data', []) as PodKind[];

  const pvcs = _.get(resources, 'pvcs');
  const pvcsLoaded = _.get(pvcs, 'loaded');
  const pvcsData = _.get(pvcs, 'data', []) as K8sResourceKind[];

  const pluginItems = plugins.registry.getDashboardsOverviewInventoryItems();
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Cluster inventory</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <InventoryItem isLoading={!nodesLoaded} kind={NodeModel} resources={nodesData} mapper={getNodeStatusGroups} />
        <InventoryItem isLoading={!podsLoaded} kind={PodModel} resources={podsData} mapper={getPodStatusGroups} />
        <InventoryItem isLoading={!pvcsLoaded} kind={PersistentVolumeClaimModel} useAbbr resources={pvcsData} mapper={getPVCStatusGroups} />
        {pluginItems.map((item, index) => {
          const resource = _.get(resources, uniqueResource(item.properties.resource, index).prop);
          const resourceLoaded = _.get(resource, 'loaded');
          const resourceData = _.get(resource, 'data', []) as K8sResourceKind[];

          const additionalResources = {};
          if (item.properties.additionalResources) {
            item.properties.additionalResources.forEach(ar => {
              additionalResources[ar.prop] = _.get(resources, uniqueResource(ar, index).prop);
            });
          }
          const additionalResourcesLoaded = Object.keys(additionalResources).every(key => _.get(additionalResources[key], 'loaded'));
          const additionalResourcesData = {};

          Object.keys(additionalResources).forEach(key => additionalResourcesData[key] = _.get(additionalResources[key], 'data', []));

          return (
            <InventoryItem
              key={index}
              isLoading={!resourceLoaded || !additionalResourcesLoaded}
              kind={item.properties.model}
              resources={resourceData}
              additionalResources={additionalResourcesData}
              mapper={item.properties.mapper}
              useAbbr={item.properties.useAbbr}
            />
          );
        })}
      </DashboardCardBody>
    </DashboardCard>
  );
};

export const InventoryCard = withDashboardResources(InventoryCard_);
