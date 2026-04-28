import { useEffect, useContext, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDynamicK8sWatchResources } from '@console/shared/src/hooks/useDynamicK8sWatchResources';
import { Card, CardBody, CardHeader, CardTitle, Stack, StackItem } from '@patternfly/react-core';
import {
  PodModel,
  DeploymentModel,
  DeploymentConfigModel,
  PersistentVolumeClaimModel,
  ServiceModel,
  StatefulSetModel,
  RouteModel,
  ConfigMapModel,
  SecretModel,
  VolumeSnapshotModel,
} from '../../../models';
import {
  ResourceInventoryItem,
  StatusGroupMapper,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import {
  getPodStatusGroups,
  getPVCStatusGroups,
  getVSStatusGroups,
} from '@console/shared/src/components/dashboard/inventory-card/utils';
import { useAccessReview } from '../../utils/rbac';
import { K8sKind, referenceForModel } from '../../../module/k8s';
import { getName } from '@console/shared/src/selectors/common';
import { ProjectDashboardContext } from './project-dashboard-context';
import {
  useResolvedExtensions,
  DashboardsProjectOverviewInventoryItem,
  isDashboardsProjectOverviewInventoryItem,
  K8sResourceCommon,
  WatchK8sResource,
  WatchK8sResources,
  ProjectOverviewInventoryItem,
  isProjectOverviewInventoryItem,
} from '@console/dynamic-plugin-sdk';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ErrorBoundary } from '@console/shared/src/components/error';

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
  ({ projectName, model, mapper, additionalResources, additionalDynamicResources }) => {
    const { watchResource, stopWatchResource, results: resources } = useDynamicK8sWatchResources();

    useEffect(() => {
      if (!projectName) {
        return;
      }

      const resource = createWatchResource(model, projectName);
      const { prop, ...resourceConfig } = resource;
      watchResource(prop, resourceConfig);
      if (additionalResources) {
        additionalResources.forEach((r) => {
          const { prop: key, ...config } = { ...r, namespace: projectName };
          watchResource(key, config);
        });
      }

      return () => {
        stopWatchResource(resource.prop);
        if (additionalResources) {
          additionalResources.forEach((r) => stopWatchResource(r.prop));
        }
      };
    }, [watchResource, stopWatchResource, projectName, model, additionalResources]);

    const resourceResult = resources.resource?.data;
    const resourceData = Array.isArray(resourceResult) ? resourceResult : [];
    const resourceLoaded = resources.resource?.loaded ?? false;
    const resourceLoadError = resources.resource?.loadError;

    const additionalResourcesData = additionalResources
      ? additionalResources.reduce<{ [key: string]: K8sResourceCommon[] }>((acc, r) => {
          const data = resources[r.prop]?.data;
          acc[r.prop] = Array.isArray(data) ? data : [];
          return acc;
        }, {})
      : {};
    const additionalResourcesLoaded = additionalResources
      ? additionalResources
          .filter((r) => !r.optional)
          .every((r) => resources[r.prop]?.loaded ?? false)
      : true;
    const additionalResourcesLoadError = additionalResources
      ? additionalResources.filter((r) => !r.optional).some((r) => !!resources[r.prop]?.loadError)
      : false;

    const dynamicResources = useK8sWatchResources(additionalDynamicResources || {});
    const dynamicResourcesError = Object.values(dynamicResources).find((r) => r.loadError)
      ?.loadError;
    const dynamicResourcesLoaded = Object.keys(dynamicResources).every(
      (key) => dynamicResources[key].loaded,
    );

    return (
      <StackItem>
        <ResourceInventoryItem
          kind={model}
          isLoading={
            !projectName || !resourceLoaded || !additionalResourcesLoaded || !dynamicResourcesLoaded
          }
          namespace={projectName}
          error={!!resourceLoadError || additionalResourcesLoadError || dynamicResourcesError}
          resources={resourceData}
          additionalResources={additionalResourcesData}
          mapper={mapper}
          dataTest="resource-inventory-item"
        />
      </StackItem>
    );
  },
);

export const InventoryCard = memo(() => {
  const [itemExtensions] = useResolvedExtensions<DashboardsProjectOverviewInventoryItem>(
    isDashboardsProjectOverviewInventoryItem,
  );
  const [inventoryExtensions] = useResolvedExtensions<ProjectOverviewInventoryItem>(
    isProjectOverviewInventoryItem,
  );

  const { obj } = useContext(ProjectDashboardContext);
  const projectName = getName(obj);
  const canListSecrets = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    namespace: projectName,
    verb: 'list',
  });
  const { t } = useTranslation();

  return (
    <Card data-test-id="inventory-card">
      <CardHeader>
        <CardTitle>{t('public~Inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
        <Stack hasGutter>
          <ProjectInventoryItem projectName={projectName} model={DeploymentModel} />
          <ProjectInventoryItem projectName={projectName} model={DeploymentConfigModel} />
          <ProjectInventoryItem projectName={projectName} model={StatefulSetModel} />
          <ProjectInventoryItem
            projectName={projectName}
            model={PodModel}
            mapper={getPodStatusGroups}
          />
          <ProjectInventoryItem
            projectName={projectName}
            model={PersistentVolumeClaimModel}
            mapper={getPVCStatusGroups}
          />
          <ProjectInventoryItem projectName={projectName} model={ServiceModel} />
          <ProjectInventoryItem projectName={projectName} model={RouteModel} />
          <ProjectInventoryItem projectName={projectName} model={ConfigMapModel} />
          {canListSecrets && <ProjectInventoryItem projectName={projectName} model={SecretModel} />}
          <ProjectInventoryItem
            projectName={projectName}
            model={VolumeSnapshotModel}
            mapper={getVSStatusGroups}
          />
          {itemExtensions.map((item) => (
            <ProjectInventoryItem
              key={item.properties.model.kind}
              projectName={projectName}
              model={item.properties.model}
              mapper={item.properties.mapper}
              additionalDynamicResources={item.properties.additionalResources}
            />
          ))}
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
  additionalResources?: (WatchK8sResource & { prop: string })[];
  additionalDynamicResources?: WatchK8sResources<{
    [key: string]: K8sResourceCommon[];
  }>;
};
