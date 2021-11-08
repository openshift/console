import * as React from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
import {
  ResourceInventoryItem,
  StatusGroupMapper,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { useTranslation } from 'react-i18next';

import { DashboardItemProps, withDashboardResources } from '../../with-dashboard-resources';
import { K8sKind, referenceForModel, K8sResourceCommon } from '../../../../module/k8s';
import { AsyncComponent } from '../../../utils';
import {
  useExtensions,
  DashboardsOverviewInventoryItem,
  DashboardsOverviewInventoryItemReplacement,
  isDashboardsOverviewInventoryItem,
  isDashboardsOverviewInventoryItemReplacement,
  LazyLoader,
} from '@console/plugin-sdk';
import {
  useResolvedExtensions,
  DashboardsOverviewInventoryItem as DynamicDashboardsOverviewInventoryItem,
  DashboardsOverviewInventoryItemReplacement as DynamicDashboardsOverviewInventoryItemReplacement,
  isDashboardsOverviewInventoryItem as isDynamicDashboardsOverviewInventoryItem,
  isDashboardsOverviewInventoryItemReplacement as isDynamicDashboardsOverviewInventoryItemReplacement,
  ResolvedExtension,
  WatchK8sResources,
} from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource, useK8sWatchResources } from '../../../utils/k8s-watch-hook';

const mergeItems = (
  items: DashboardsOverviewInventoryItem[],
  replacements: DashboardsOverviewInventoryItemReplacement[],
) =>
  items.map(
    (item) => replacements.find((r) => r.properties.model === item.properties.model) || item,
  );

const mergeDynamicItems = (
  dynamicItems: ResolvedExtension<DynamicDashboardsOverviewInventoryItem>[],
  dynamicReplacements: ResolvedExtension<DynamicDashboardsOverviewInventoryItemReplacement>[],
) =>
  dynamicItems.map(
    (item) => dynamicReplacements.find((r) => r.properties.model === item.properties.model) || item,
  );

const getFirehoseResource = (model: K8sKind) => ({
  isList: true,
  kind: model.crd ? referenceForModel(model) : model.kind,
  prop: 'resource',
});

const ClusterInventoryItem = withDashboardResources<ClusterInventoryItemProps>(
  React.memo(
    ({
      model,
      resolvedMapper,
      mapperLoader,
      additionalResources,
      expandedComponent,
    }: ClusterInventoryItemProps) => {
      const mainResource = React.useMemo(() => getFirehoseResource(model), [model]);
      const otherResources = React.useMemo(() => additionalResources || {}, [additionalResources]);
      const [mapper, setMapper] = React.useState<StatusGroupMapper>();
      const [resourceData, resourceLoaded, resourceLoadError] = useK8sWatchResource<
        K8sResourceCommon[]
      >(mainResource);
      const resources = useK8sWatchResources(otherResources);
      React.useEffect(() => {
        mapperLoader &&
          mapperLoader()
            .then((res) => setMapper(() => res))
            .catch(() => {
              // eslint-disable-next-line no-console
              console.error('Mapper does not exist in module');
            });
      }, [mapperLoader]);

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
          mapper={mapper || resolvedMapper}
          additionalResources={additionalResourcesData}
          ExpandedComponent={expandedComponent ? ExpandedComponent : null}
        />
      );
    },
  ),
);

export const InventoryCard = () => {
  const itemExtensions = useExtensions<DashboardsOverviewInventoryItem>(
    isDashboardsOverviewInventoryItem,
  );
  const [dynamicItemExtensions] = useResolvedExtensions<DynamicDashboardsOverviewInventoryItem>(
    isDynamicDashboardsOverviewInventoryItem,
  );

  const replacementExtensions = useExtensions<DashboardsOverviewInventoryItemReplacement>(
    isDashboardsOverviewInventoryItemReplacement,
  );
  const [dynamicReplacementExtensions] = useResolvedExtensions<
    DynamicDashboardsOverviewInventoryItemReplacement
  >(isDynamicDashboardsOverviewInventoryItemReplacement);

  const mergedItems = React.useMemo(() => mergeItems(itemExtensions, replacementExtensions), [
    itemExtensions,
    replacementExtensions,
  ]);

  const dynamicMergedItems = React.useMemo(
    () => mergeDynamicItems(dynamicItemExtensions, dynamicReplacementExtensions),
    [dynamicItemExtensions, dynamicReplacementExtensions],
  );

  const { t } = useTranslation();

  return (
    <Card data-test-id="inventory-card">
      <CardHeader>
        <CardTitle>{t('public~Cluster inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
        {mergedItems.map((item) => (
          <ClusterInventoryItem
            key={item.properties.model.kind}
            model={item.properties.model}
            mapperLoader={item.properties.mapper}
            additionalResources={item.properties.additionalResources}
            expandedComponent={item.properties.expandedComponent}
          />
        ))}
        {dynamicMergedItems.map((item) => (
          <ClusterInventoryItem
            key={item.properties.model.kind}
            model={item.properties.model}
            resolvedMapper={item.properties.mapper}
            additionalResources={item.properties.additionalResources}
          />
        ))}
      </CardBody>
    </Card>
  );
};

type ClusterInventoryItemProps = DashboardItemProps & {
  model: K8sKind;
  mapperLoader?: () => Promise<StatusGroupMapper>;
  resolvedMapper?: StatusGroupMapper;
  additionalResources?: WatchK8sResources<any>;
  expandedComponent?: LazyLoader;
};
