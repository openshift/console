import * as React from 'react';
import * as _ from 'lodash-es';
import { connect } from 'react-redux';
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
import { K8sResourceKind, K8sKind, referenceForModel } from '../../../../module/k8s';
import { FirehoseResource, AsyncComponent } from '../../../utils';
import { connectToFlags, FlagsObject, WithFlagsProps } from '../../../../reducers/features';
import {
  LazyLoader,
  isDashboardsOverviewInventoryItem,
  isDashboardsOverviewInventoryItemReplacement,
  DashboardsOverviewInventoryItem,
  DashboardsOverviewInventoryItemReplacement,
} from '@console/plugin-sdk';

const filterExtension = (
  extensions: Array<DashboardsOverviewInventoryItem | DashboardsOverviewInventoryItemReplacement>,
  k8sModels: ImmutableMap<string, K8sKind>,
  flags: FlagsObject,
) =>
  extensions.filter((e) => {
    if (!plugins.registry.isExtensionInUse(e, flags)) {
      return false;
    }
    const { model, additionalResources } = e.properties;
    if (!k8sModels.get(model.crd ? referenceForModel(model) : model.kind)) {
      return false;
    }
    if (additionalResources) {
      return additionalResources.filter((r) => !r.optional).every((r) => !!k8sModels.get(r.kind));
    }
    return true;
  });

const getItems = (flags: FlagsObject, k8sModels: ImmutableMap<string, K8sKind>) => {
  const items = filterExtension(
    plugins.registry.getDashboardsOverviewInventoryItems(),
    k8sModels,
    flags,
  );
  const replacements = filterExtension(
    plugins.registry.getDashboardsOverviewInventoryItemReplacements(),
    k8sModels,
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
      watchK8sResource,
      stopWatchK8sResource,
      resources,
      model,
      mapper,
      useAbbr,
      additionalResources,
      expandedComponent,
    }) => {
      React.useEffect(() => {
        const resource = getFirehoseResource(model);
        watchK8sResource(resource);
        if (additionalResources) {
          additionalResources.forEach(watchK8sResource);
        }
        return () => {
          stopWatchK8sResource(resource);
          if (additionalResources) {
            additionalResources.forEach(stopWatchK8sResource);
          }
        };
      }, [watchK8sResource, stopWatchK8sResource, model, additionalResources]);

      const resourceData = _.get(resources.resource, 'data') as K8sResourceKind[];
      const resourceLoaded = _.get(resources.resource, 'loaded');
      const resourceLoadError = _.get(resources.resource, 'loadError');

      const additionalResourcesData = {};
      let additionalResourcesLoaded = true;
      let additionalResourcesLoadError = false;
      if (additionalResources) {
        additionalResourcesLoaded = additionalResources
          .filter((r) => !r.optional)
          .every((r) => _.get(resources[r.prop], 'loaded'));
        additionalResources.forEach((r) => {
          additionalResourcesData[r.prop] = _.get(resources[r.prop], 'data');
        });
        additionalResourcesLoadError = additionalResources
          .filter((r) => !r.optional)
          .some((r) => !!_.get(resources[r.prop], 'loadError'));
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

const mapStateToProps = ({ k8s }) => ({
  k8sModels: k8s.getIn(['RESOURCES', 'models']),
});

export const InventoryCard = connect(mapStateToProps)(
  connectToFlags<InventoryCardProps>(
    ...plugins.registry.getGatingFlagNames([isDashboardsOverviewInventoryItem]),
    ...plugins.registry.getGatingFlagNames([isDashboardsOverviewInventoryItemReplacement]),
  )(({ flags, k8sModels }) => {
    const items = getItems(flags, k8sModels);
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
  }),
);

type InventoryCardProps = WithFlagsProps & {
  k8sModels: ImmutableMap<string, K8sKind>;
};

type ClusterInventoryItemProps = DashboardItemProps & {
  model: K8sKind;
  mapper?: StatusGroupMapper;
  useAbbr?: boolean;
  additionalResources?: FirehoseResource[];
  expandedComponent?: LazyLoader;
};
