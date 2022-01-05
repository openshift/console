import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';
import { DashboardItemProps, withDashboardResources } from '../with-dashboard-resources';
import { Card, CardBody, CardHeader, CardTitle } from '@patternfly/react-core';
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
  useResolvedExtensions,
  DashboardsProjectOverviewInventoryItem,
  isDashboardsProjectOverviewInventoryItem,
  K8sResourceCommon,
  WatchK8sResources,
} from '@console/dynamic-plugin-sdk';

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
  }: ProjectInventoryItemProps) => {
    React.useEffect(() => {
      if (projectName) {
        const resource = createFirehoseResource(model, projectName);
        watchK8sResource(resource);
        return () => {
          stopWatchK8sResource(resource);
        };
      }
    }, [watchK8sResource, stopWatchK8sResource, projectName, model]);

    const resourceData = _.get(resources.resource, 'data', []) as FirehoseResult['data'];
    const resourceLoaded = _.get(resources.resource, 'loaded');
    const resourceLoadError = _.get(resources.resource, 'loadError');

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

    return (
      <ResourceInventoryItem
        kind={model}
        isLoading={!projectName || !resourceLoaded || !additionalResourcesLoaded}
        namespace={projectName}
        error={!!resourceLoadError || additionalResourcesLoadError}
        resources={resourceData}
        additionalResources={additionalResourcesData}
        mapper={mapper}
      />
    );
  },
);

export const InventoryCard = () => {
  const [dynamicItemExtensions] = useResolvedExtensions<DashboardsProjectOverviewInventoryItem>(
    isDashboardsProjectOverviewInventoryItem,
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
    <Card data-test-id="inventory-card">
      <CardHeader>
        <CardTitle>{t('public~Inventory')}</CardTitle>
      </CardHeader>
      <CardBody>
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
        {dynamicItemExtensions.map((item) => (
          <ProjectInventoryItem
            key={item.properties.model.kind}
            projectName={projectName}
            model={item.properties.model}
            mapper={item.properties.mapper}
            additionalResources={item.properties.additionalResources}
          />
        ))}
        <ProjectInventoryItem
          projectName={projectName}
          model={VolumeSnapshotModel}
          mapper={getVSStatusGroups}
        />
      </CardBody>
    </Card>
  );
};

type ProjectInventoryItemProps = DashboardItemProps & {
  projectName: string;
  model: K8sKind;
  mapper?: StatusGroupMapper;
  additionalResources?: WatchK8sResources<{
    [key: string]: K8sResourceCommon[];
  }>;
};
