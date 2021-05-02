import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
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
import { FirehoseResult, FirehoseResource, useAccessReview } from '../../utils';
import { K8sKind, referenceForModel } from '../../../module/k8s';
import { getName } from '@console/shared';
import { ProjectDashboardContext } from './project-dashboard-context';
import {
  useExtensions,
  ProjectDashboardInventoryItem,
  isProjectDashboardInventoryItem,
} from '@console/plugin-sdk';
import {
  useResolvedExtensions,
  ProjectDashboardInventoryItem as DynamicProjectDashboardInventoryItem,
  isProjectDashboardInventoryItem as isDynamicProjectDashboardInventoryItem,
  K8sResourceCommon,
} from '@console/dynamic-plugin-sdk';
import {
  useK8sWatchResources,
  WatchK8sResources,
} from '@console/internal/components/utils/k8s-watch-hook';

const createFirehoseResource = (model: K8sKind, projectName: string): FirehoseResource => ({
  kind: model.crd ? referenceForModel(model) : model.kind,
  isList: true,
  prop: 'resource',
  namespace: projectName,
});

const ProjectInventoryItem = withDashboardResources(
  ({
    projectName,
    watchK8sResource,
    stopWatchK8sResource,
    resources,
    model,
    mapper,
    additionalResources,
    additionalDynamicResources,
  }: ProjectInventoryItemProps) => {
    React.useEffect(() => {
      if (projectName) {
        const resource = createFirehoseResource(model, projectName);
        watchK8sResource(resource);
        if (additionalResources) {
          additionalResources.forEach((r) => watchK8sResource({ ...r, namespace: projectName }));
        }
        return () => {
          stopWatchK8sResource(resource);
          if (additionalResources) {
            additionalResources.forEach(stopWatchK8sResource);
          }
        };
      }
    }, [watchK8sResource, stopWatchK8sResource, projectName, model, additionalResources]);

    const resourceData = _.get(resources.resource, 'data', []) as FirehoseResult['data'];
    const resourceLoaded = _.get(resources.resource, 'loaded');
    const resourceLoadError = _.get(resources.resource, 'loadError');

    const additionalResourcesData = additionalResources
      ? additionalResources.reduce((acc, r) => {
          acc[r.prop] = _.get(resources[r.prop], 'data');
          return acc;
        }, {})
      : {};
    const additionalResourcesLoaded = additionalResources
      ? additionalResources
          .filter((r) => !r.optional)
          .every((r) => _.get(resources[r.prop], 'loaded'))
      : true;
    const additionalResourcesLoadError = additionalResources
      ? additionalResources
          .filter((r) => !r.optional)
          .some((r) => !!_.get(resources[r.prop], 'loadError'))
      : false;

    const dynamicResources = useK8sWatchResources(additionalDynamicResources || {});
    const dynamicResourcesError = Object.values(dynamicResources).find((r) => r.loadError)
      ?.loadError;
    const dynamicResourcesLoaded = Object.keys(dynamicResources).every(
      (key) => dynamicResources[key].loaded,
    );

    return (
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
      />
    );
  },
);

export const InventoryCard = () => {
  const itemExtensions = useExtensions<ProjectDashboardInventoryItem>(
    isProjectDashboardInventoryItem,
  );
  const [dynamicItemExtensions] = useResolvedExtensions<DynamicProjectDashboardInventoryItem>(
    isDynamicProjectDashboardInventoryItem,
  );
  const { obj } = React.useContext(ProjectDashboardContext);
  const projectName = getName(obj);
  const canListSecrets = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    namespace: projectName,
    verb: 'list',
  });
  const { t } = useTranslation();

  return (
    <DashboardCard data-test-id="inventory-card">
      <DashboardCardHeader>
        <DashboardCardTitle>{t('public~Inventory')}</DashboardCardTitle>
      </DashboardCardHeader>
      <DashboardCardBody>
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
        {itemExtensions.map((item) => (
          <ProjectInventoryItem
            key={item.properties.model.kind}
            projectName={projectName}
            model={item.properties.model}
            mapper={item.properties.mapper}
            additionalResources={item.properties.additionalResources}
          />
        ))}
        {dynamicItemExtensions.map((item) => (
          <ProjectInventoryItem
            key={item.properties.model.kind}
            projectName={projectName}
            model={item.properties.model}
            mapper={item.properties.mapper}
            additionalDynamicResources={item.properties.additionalResources}
          />
        ))}
        <ProjectInventoryItem
          projectName={projectName}
          model={VolumeSnapshotModel}
          mapper={getVSStatusGroups}
        />
      </DashboardCardBody>
    </DashboardCard>
  );
};

type ProjectInventoryItemProps = DashboardItemProps & {
  projectName: string;
  model: K8sKind;
  mapper?: StatusGroupMapper;
  additionalResources?: FirehoseResource[];
  additionalDynamicResources?: WatchK8sResources<{
    [key: string]: K8sResourceCommon[];
  }>;
};
