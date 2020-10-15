import * as React from 'react';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
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
  useK8sWatchResource,
  useK8sWatchResources,
  WatchK8sResources,
} from '../../../utils/k8s-watch-hook';

const mergeItems = (
  items: DashboardsOverviewInventoryItem[],
  replacements: DashboardsOverviewInventoryItemReplacement[],
) =>
  items.map(
    (item) => replacements.find((r) => r.properties.model === item.properties.model) || item,
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
      mapperLoader,
      useAbbr,
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
          mapper={mapper}
          useAbbr={useAbbr}
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

  const replacementExtensions = useExtensions<DashboardsOverviewInventoryItemReplacement>(
    isDashboardsOverviewInventoryItemReplacement,
  );

  const mergedItems = React.useMemo(() => mergeItems(itemExtensions, replacementExtensions), [
    itemExtensions,
    replacementExtensions,
  ]);

  const { t } = useTranslation();

  return (
    <DashboardCard data-test-id="inventory-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('dashboard~Cluster inventory')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
        {mergedItems.map((item) => (
          <ClusterInventoryItem
            key={item.properties.model.kind}
            model={item.properties.model}
            mapperLoader={item.properties.mapper}
            additionalResources={item.properties.additionalResources}
            useAbbr={item.properties.useAbbr}
            expandedComponent={item.properties.expandedComponent}
          />
        ))}
      </DashboardCardBody>
    </DashboardCard>
  );
};

type ClusterInventoryItemProps = DashboardItemProps & {
  model: K8sKind;
  mapperLoader?: () => Promise<StatusGroupMapper>;
  useAbbr?: boolean;
  additionalResources?: WatchK8sResources<any>;
  expandedComponent?: LazyLoader;
};
