import * as React from 'react';
import * as _ from 'lodash-es';

import * as plugins from '../../../plugins';
import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  DashboardCardTitle,
} from '../../dashboard/dashboard-card';
import { ResourceInventoryItem } from '../../dashboard/inventory-card/inventory-item';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { PodModel, NodeModel, PersistentVolumeClaimModel } from '../../../models';
import { K8sResourceKind, PodKind } from '../../../module/k8s';
import { getPodStatusGroups, getNodeStatusGroups, getPVCStatusGroups } from '../../dashboard/inventory-card/utils';
import { FirehoseResource } from '../../utils';
import { connectToFlags, FlagsObject, WithFlagsProps } from '../../../reducers/features';
import { getFlagsForExtensions } from '../utils';
import { uniqueResource } from './utils';

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

const getItems = (flags: FlagsObject) =>
  plugins.registry.getDashboardsOverviewInventoryItems().filter(e => flags[e.properties.required]);

const getResourcesToWatch = (flags: FlagsObject): FirehoseResource[] => {
  const allResources = [...k8sResources];
  getItems(flags).forEach((item, index) => {
    allResources.push(uniqueResource(item.properties.resource, index));
    if (item.properties.additionalResources) {
      item.properties.additionalResources.forEach(ar => allResources.push(uniqueResource(ar, index)));
    }
  });
  return allResources;
};

const InventoryCard_: React.FC<DashboardItemProps & WithFlagsProps> = ({
  watchK8sResource,
  stopWatchK8sResource,
  resources,
  flags = {},
}) => {
  React.useEffect(() => {
    const resourcesToWatch = getResourcesToWatch(flags);
    resourcesToWatch.forEach(r => watchK8sResource(r));

    return () => {
      resourcesToWatch.forEach(r => stopWatchK8sResource(r));
    };
    // TODO: to be removed: use JSON.stringify(flags) to avoid deep comparison of flags object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchK8sResource, stopWatchK8sResource, JSON.stringify(flags)]);

  const nodesLoaded = _.get(resources.nodes, 'loaded');
  const nodesLoadError = _.get(resources.nodes, 'loadError');
  const nodesData = _.get(resources.nodes, 'data', []) as K8sResourceKind[];

  const podsLoaded = _.get(resources.pods, 'loaded');
  const podsLoadError = _.get(resources.pods, 'loadError');
  const podsData = _.get(resources.pods, 'data', []) as PodKind[];

  const pvcsLoaded = _.get(resources.pvcs, 'loaded');
  const pvcsLoadError = _.get(resources.pvcs, 'loadError');
  const pvcsData = _.get(resources.pvcs, 'data', []) as K8sResourceKind[];

  const pluginItems = getItems(flags);

  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Cluster Inventory</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        <ResourceInventoryItem isLoading={!nodesLoaded} error={!!nodesLoadError} kind={NodeModel} resources={nodesData} mapper={getNodeStatusGroups} />
        <ResourceInventoryItem isLoading={!podsLoaded} error={!!podsLoadError} kind={PodModel} resources={podsData} mapper={getPodStatusGroups} />
        <ResourceInventoryItem isLoading={!pvcsLoaded} error={!!pvcsLoadError} kind={PersistentVolumeClaimModel} useAbbr resources={pvcsData} mapper={getPVCStatusGroups} />
        {pluginItems.map((item, index) => {
          const resource = _.get(resources, uniqueResource(item.properties.resource, index).prop);
          const resourceLoaded = _.get(resource, 'loaded');
          const resourceLoadError = _.get(resource, 'loadError');
          const resourceData = _.get(resource, 'data', []) as K8sResourceKind[];

          const additionalResources = {};
          if (item.properties.additionalResources) {
            item.properties.additionalResources.forEach(ar => {
              additionalResources[ar.prop] = _.get(resources, uniqueResource(ar, index).prop);
            });
          }
          const additionalResourcesLoaded = Object.keys(additionalResources).every(key =>
            !additionalResources[key] || additionalResources[key].loaded || additionalResources[key].loadError
          );
          const additionalResourcesData = {};

          Object.keys(additionalResources).forEach(key => additionalResourcesData[key] = _.get(additionalResources[key], 'data', []));

          return (
            <ResourceInventoryItem
              key={index}
              isLoading={!resourceLoaded || !additionalResourcesLoaded}
              error={!!resourceLoadError}
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

export const InventoryCard = connectToFlags(
  ...getFlagsForExtensions(plugins.registry.getDashboardsOverviewInventoryItems()),
)(withDashboardResources(InventoryCard_));
