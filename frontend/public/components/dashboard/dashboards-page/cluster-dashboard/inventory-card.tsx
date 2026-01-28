import { memo, useMemo, useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardTitle, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import {
  ResourceInventoryItem,
  StatusGroupMapper,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { ErrorBoundary } from '@console/shared/src/components/error';
import { K8sKind, referenceForModel, K8sResourceCommon } from '../../../../module/k8s';
import {
  useResolvedExtensions,
  DashboardsOverviewInventoryItem,
  DashboardsOverviewInventoryItemReplacement,
  isDashboardsOverviewInventoryItem,
  isDashboardsOverviewInventoryItemReplacement,
  ResolvedExtension,
  WatchK8sResources,
  ClusterOverviewInventoryItem,
  isClusterOverviewInventoryItem,
} from '@console/dynamic-plugin-sdk';
import { useK8sWatchResource, useK8sWatchResources } from '../../../utils/k8s-watch-hook';

const mergeItems = (
  items: ResolvedExtension<DashboardsOverviewInventoryItem>[],
  replacements: ResolvedExtension<DashboardsOverviewInventoryItemReplacement>[],
) =>
  items.map(
    (item) => replacements.find((r) => r.properties.model === item.properties.model) || item,
  );

const getFirehoseResource = (model: K8sKind) => ({
  isList: true,
  kind: model.crd ? referenceForModel(model) : model.kind,
  prop: 'resource',
});

const ClusterInventoryItem = memo<ClusterInventoryItemProps>(
  ({ model, resolvedMapper, mapperLoader, additionalResources }) => {
    const mainResource = useMemo(() => getFirehoseResource(model), [model]);
    const otherResources = useMemo(() => additionalResources || {}, [additionalResources]);
    const [mapper, setMapper] = useState<StatusGroupMapper>();
    const [resourceData, resourceLoaded, resourceLoadError] = useK8sWatchResource<
      K8sResourceCommon[]
    >(mainResource);
    const resources = useK8sWatchResources(otherResources);
    useEffect(() => {
      mapperLoader &&
        mapperLoader()
          .then((res) => setMapper(() => res))
          .catch(() => {
            // eslint-disable-next-line no-console
            console.error('Mapper does not exist in module');
          });
    }, [mapperLoader]);

    const [
      additionalResourcesData,
      additionalResourcesLoaded,
      additionalResourcesLoadError,
    ] = useMemo(() => {
      const resourcesData = {};
      let resourcesLoaded = true;
      let resourcesLoadError = false;

      if (additionalResources) {
        resourcesLoaded = Object.keys(additionalResources)
          .filter((key) => !additionalResources[key].optional)
          .every((key) => resources[key].loaded);
        Object.keys(additionalResources).forEach((key) => {
          resourcesData[key] = resources[key].data;
        });
        resourcesLoadError = Object.keys(additionalResources)
          .filter((key) => !additionalResources[key].optional)
          .some((key) => !!resources[key].loadError);
      }

      return [resourcesData, resourcesLoaded, resourcesLoadError];
    }, [additionalResources, resources]);

    return (
      <ResourceInventoryItem
        isLoading={!resourceLoaded || !additionalResourcesLoaded}
        error={!!resourceLoadError || additionalResourcesLoadError}
        kind={model}
        resources={resourceData}
        mapper={mapper || resolvedMapper}
        additionalResources={additionalResourcesData}
        dataTest="resource-inventory-item"
      />
    );
  },
);

export const InventoryCard = () => {
  const [itemExtensions] = useResolvedExtensions<DashboardsOverviewInventoryItem>(
    isDashboardsOverviewInventoryItem,
  );

  const [replacementExtensions] = useResolvedExtensions<DashboardsOverviewInventoryItemReplacement>(
    isDashboardsOverviewInventoryItemReplacement,
  );

  const [inventoryExtensions] = useResolvedExtensions<ClusterOverviewInventoryItem>(
    isClusterOverviewInventoryItem,
  );

  const mergedItems = useMemo(() => mergeItems(itemExtensions, replacementExtensions), [
    itemExtensions,
    replacementExtensions,
  ]);

  const { t } = useTranslation();

  return (
    <Card data-test-id="inventory-card">
      <CardHeader>
        <CardTitle>{t('public~Cluster inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          {mergedItems.map((item) => (
            <StackItem key={item.properties.model.kind}>
              <ClusterInventoryItem
                model={item.properties.model}
                resolvedMapper={item.properties.mapper}
                additionalResources={item.properties.additionalResources}
              />
            </StackItem>
          ))}
          {inventoryExtensions.map(({ uid, properties: { component: Component } }) => (
            <ErrorBoundary key={uid}>
              <StackItem>
                <Component />
              </StackItem>
            </ErrorBoundary>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
};

type ClusterInventoryItemProps = {
  model: K8sKind;
  mapperLoader?: () => Promise<StatusGroupMapper>;
  resolvedMapper?: StatusGroupMapper;
  additionalResources?: WatchK8sResources<any>;
};
