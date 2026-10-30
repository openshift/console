import { useEffect, useContext, memo } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Stack,
  StackItem,
  Skeleton,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import type {
  DashboardsProjectOverviewInventoryItem,
  K8sResourceCommon,
  WatchK8sResource,
  WatchK8sResources,
  ProjectOverviewInventoryItem,
} from '@console/dynamic-plugin-sdk';
import {
  useResolvedExtensions,
  isDashboardsProjectOverviewInventoryItem,
  isProjectOverviewInventoryItem,
} from '@console/dynamic-plugin-sdk';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import type { StatusGroupMapper } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { ResourceInventoryItem } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { PrometheusInventoryItem } from '@console/shared/src/components/dashboard/inventory-card/PrometheusInventoryItem';
import { ErrorBoundary } from '@console/shared/src/components/error/error-boundary';
import { useDynamicK8sWatchResources } from '@console/shared/src/hooks/useDynamicK8sWatchResources';
import { usePrometheusGate } from '@console/shared/src/hooks/usePrometheusGate';
import { getName } from '@console/shared/src/selectors/common';
import type { K8sKind } from '../../../module/k8s';
import { referenceForModel } from '../../../module/k8s';
import { ProjectDashboardContext } from './project-dashboard-context';

const createWatchResource = (
  model: K8sKind,
  projectName: string,
): WatchK8sResource & { prop: string } => ({
  kind: model.crd ? referenceForModel(model) : model.kind,
  isList: true,
  prop: 'resource',
  namespace: projectName,
});

const ProjectInventoryItem = memo<ProjectInventoryItemProps>(
  ({ projectName, model, mapper, additionalDynamicResources }) => {
    const { watchResource, stopWatchResource, results: resources } = useDynamicK8sWatchResources();

    useEffect(() => {
      if (!projectName) {
        return;
      }

      const resource = createWatchResource(model, projectName);
      const { prop, ...resourceConfig } = resource;
      watchResource(prop, resourceConfig);
      return () => stopWatchResource(resource.prop);
    }, [watchResource, stopWatchResource, projectName, model]);

    const resourceResult = resources.resource?.data;
    const resourceData = Array.isArray(resourceResult) ? resourceResult : [];
    const resourceLoaded = resources.resource?.loaded ?? false;
    const resourceLoadError = resources.resource?.loadError;

    const dynamicResources = useK8sWatchResources(additionalDynamicResources || {});
    const dynamicResourcesError = Object.values(dynamicResources).find(
      (r) => r.loadError,
    )?.loadError;
    const dynamicResourcesLoaded = Object.keys(dynamicResources).every(
      (key) => dynamicResources[key].loaded,
    );

    return (
      <StackItem>
        <ResourceInventoryItem
          kind={model}
          isLoading={!projectName || !resourceLoaded || !dynamicResourcesLoaded}
          namespace={projectName}
          error={!!resourceLoadError || !!dynamicResourcesError}
          resources={resourceData}
          mapper={mapper}
          dataTest="resource-inventory-item"
        />
      </StackItem>
    );
  },
);

export const InventoryCard = memo(() => {
  const [itemExtensions, itemsResolved] =
    useResolvedExtensions<DashboardsProjectOverviewInventoryItem>(
      isDashboardsProjectOverviewInventoryItem,
    );
  const [inventoryExtensions] = useResolvedExtensions<ProjectOverviewInventoryItem>(
    isProjectOverviewInventoryItem,
  );
  const prometheusIsAvailable = usePrometheusGate();
  const { obj } = useContext(ProjectDashboardContext);
  const projectName = getName(obj);
  const { t } = useTranslation('public');

  return (
    <Card data-test="inventory-card" data-test-id="inventory-card">
      <CardHeader>
        <CardTitle>{t('Inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          {!itemsResolved && <Skeleton screenreaderText={t('Loading')} />}
          {itemExtensions.map((item) =>
            item.properties.prometheus && prometheusIsAvailable !== false ? (
              <StackItem key={item.uid}>
                <PrometheusInventoryItem
                  model={item.properties.model}
                  namespace={projectName}
                  query={() =>
                    projectName ? item.properties.prometheus.getQuery(projectName) : ''
                  }
                  prometheusIsAvailable={prometheusIsAvailable}
                  mapper={item.properties.prometheus.mapper}
                />
              </StackItem>
            ) : (
              <ProjectInventoryItem
                key={item.uid}
                projectName={projectName}
                model={item.properties.model}
                mapper={item.properties.mapper}
                additionalDynamicResources={item.properties.additionalResources}
              />
            ),
          )}
          {inventoryExtensions.map(({ uid, properties: { component: Component } }) => (
            <ErrorBoundary key={uid}>
              <StackItem>
                <Component projectName={projectName} />
              </StackItem>
            </ErrorBoundary>
          ))}
        </Stack>
      </CardBody>
    </Card>
  );
});

type ProjectInventoryItemProps = {
  projectName: string;
  model: K8sKind;
  mapper?: StatusGroupMapper;
  additionalDynamicResources?: WatchK8sResources<{
    [key: string]: K8sResourceCommon[];
  }>;
};
