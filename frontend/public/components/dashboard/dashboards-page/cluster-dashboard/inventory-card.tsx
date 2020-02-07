import * as React from 'react';
import { Map as ImmutableMap } from 'immutable';

import * as plugins from '../../../../plugins';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import {
  ResourceInventoryItem,
  StatusGroupMapper,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { K8sKind, referenceForModel, K8sResourceCommon } from '../../../../module/k8s';
import { AsyncComponent } from '../../../utils';
import { connectToFlags, FlagsObject, WithFlagsProps } from '../../../../reducers/features';
import {
  LazyLoader,
  isDashboardsOverviewInventoryItem,
  isDashboardsOverviewInventoryItemReplacement,
  DashboardsOverviewInventoryItem,
  DashboardsOverviewInventoryItemReplacement,
} from '@console/plugin-sdk';
import {
  useK8sWatchResource,
  useK8sWatchResources,
  WatchK8sResources,
} from '../../../utils/k8s-watch-hook';

const filterExtension = (
  extensions: Array<DashboardsOverviewInventoryItem | DashboardsOverviewInventoryItemReplacement>,
  flags: FlagsObject,
) => extensions.filter((e) => plugins.registry.isExtensionInUse(e, flags));

const getItems = (flags: FlagsObject) => {
  const items = filterExtension(plugins.registry.getDashboardsOverviewInventoryItems(), flags);
  const replacements = filterExtension(
    plugins.registry.getDashboardsOverviewInventoryItemReplacements(),
    flags,
  );
  return items.map(
    (item) => replacements.find((r) => r.properties.model === item.properties.model) || item,
  );
};

const getFirehoseResource = (model: K8sKind) => ({
  isList: true,
  kind: model.crd ? referenceForModel(model) : model.kind,
  prop: 'resource',
});

const ClusterInventoryItem = withDashboardResources<ClusterInventoryItemProps>(
  React.memo(
    ({
      model,
      mapper,
      useAbbr,
      additionalResources,
      expandedComponent,
    }: ClusterInventoryItemProps) => {
      const mainResource = React.useMemo(() => getFirehoseResource(model), [model]);
      const otherResources = React.useMemo(() => additionalResources || {}, [additionalResources]);
      const [resourceData, resourceLoaded, resourceLoadError] = useK8sWatchResource<
        K8sResourceCommon[]
      >(mainResource);
      const resources = useK8sWatchResources(otherResources);

      const additionalResourcesData = {};
      let additionalResourcesLoaded = true;
      let additionalResourcesLoadError = false;
      if (additionalResources) {
        additionalResourcesLoaded = Object.keys(additionalResources)
          .filter((key) => !additionalResources[key].optional)
          .every((key) => resources[key].loaded);
        Object.keys(additionalResources).forEach((key) => {
          additionalResourcesData[key] = resources[key].data;
        });
        additionalResourcesLoadError = Object.keys(additionalResources)
          .filter((key) => !additionalResources[key].optional)
          .some((key) => !!resources[key].loadError);
      }

      const ExpandedComponent = React.useCallback(
        () => (
          <AsyncComponent
            loader={expandedComponent}
            resource={resourceData}
            additionalResources={additionalResourcesData}
          />
        ),
        [resourceData, additionalResourcesData, expandedComponent],
      );

      return (
        <ResourceInventoryItem
          isLoading={!resourceLoaded || !additionalResourcesLoaded}
          error={!!resourceLoadError || additionalResourcesLoadError}
          kind={model}
          resources={resourceData}
          mapper={mapper}
          useAbbr={useAbbr}
          additionalResources={additionalResourcesData}
          ExpandedComponent={expandedComponent ? ExpandedComponent : null}
        />
      );
    },
  ),
);
export const InventoryCard = connectToFlags<InventoryCardProps>(
  ...plugins.registry.getGatingFlagNames([isDashboardsOverviewInventoryItem]),
  ...plugins.registry.getGatingFlagNames([isDashboardsOverviewInventoryItemReplacement]),
)(({ flags }) => {
  const items = getItems(flags);
  return (
    <DashboardCard data-test-id="inventory-card">
      <DashboardCardHeader>
        <DashboardCardTitle>Cluster Inventory</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        {items.map((item) => (
          <ClusterInventoryItem
            key={item.properties.model.kind}
            model={item.properties.model}
            mapper={item.properties.mapper}
            additionalResources={item.properties.additionalResources}
            useAbbr={item.properties.useAbbr}
            expandedComponent={item.properties.expandedComponent}
          />
        ))}
      </DashboardCardBody>
    </DashboardCard>
  );
});

type InventoryCardProps = WithFlagsProps & {
  k8sModels: ImmutableMap<string, K8sKind>;
};

type ClusterInventoryItemProps = DashboardItemProps & {
  model: K8sKind;
  mapper?: StatusGroupMapper;
  useAbbr?: boolean;
  additionalResources?: WatchK8sResources<any>;
  expandedComponent?: LazyLoader;
};
