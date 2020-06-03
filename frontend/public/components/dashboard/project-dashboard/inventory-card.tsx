import * as React from 'react';
import * as _ from 'lodash-es';
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
} from '../../../models';
import {
  ResourceInventoryItem,
  StatusGroupMapper,
} from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import {
  getPodStatusGroups,
  getPVCStatusGroups,
} from '@console/shared/src/components/dashboard/inventory-card/utils';
import { FirehoseResult, FirehoseResource, useAccessReview } from '../../utils';
import { K8sKind, referenceForModel } from '../../../module/k8s';
import { getName } from '@console/shared';
import { ProjectDashboardContext } from './project-dashboard-context';
import { connectToFlags, FlagsObject } from '../../../reducers/features';
import * as plugins from '../../../plugins';
import { isProjectDashboardInventoryItem } from '@console/plugin-sdk';

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
    useAbbr,
    additionalResources,
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

    return (
      <ResourceInventoryItem
        kind={model}
        isLoading={!projectName || !resourceLoaded || !additionalResourcesLoaded}
        namespace={projectName}
        error={!!resourceLoadError || additionalResourcesLoadError}
        resources={resourceData}
        additionalResources={additionalResourcesData}
        mapper={mapper}
        useAbbr={useAbbr}
      />
    );
  },
);

const getPluginItems = (flags: FlagsObject) =>
  plugins.registry
    .getProjectDashboardInventoryItems()
    .filter((e) => plugins.registry.isExtensionInUse(e, flags));

export const InventoryCard = connectToFlags(
  ...plugins.registry.getGatingFlagNames([isProjectDashboardInventoryItem]),
)(({ flags }) => {
  const pluginItems = getPluginItems(flags);
  const { obj } = React.useContext(ProjectDashboardContext);
  const projectName = getName(obj);
  const canListSecrets = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    namespace: projectName,
    verb: 'list',
  });
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>Inventory</DashboardCardTitle>
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
          useAbbr
        />
        <ProjectInventoryItem projectName={projectName} model={ServiceModel} />
        <ProjectInventoryItem projectName={projectName} model={RouteModel} />
        <ProjectInventoryItem projectName={projectName} model={ConfigMapModel} />
        {canListSecrets && <ProjectInventoryItem projectName={projectName} model={SecretModel} />}
        {pluginItems.map((item) => (
          <ProjectInventoryItem
            key={item.properties.model.kind}
            projectName={projectName}
            model={item.properties.model}
            mapper={item.properties.mapper}
            additionalResources={item.properties.additionalResources}
            useAbbr={item.properties.useAbbr}
          />
        ))}
      </DashboardCardBody>
    </DashboardCard>
  );
});

type ProjectInventoryItemProps = DashboardItemProps & {
  projectName: string;
  model: K8sKind;
  mapper?: StatusGroupMapper;
  useAbbr?: boolean;
  additionalResources?: FirehoseResource[];
};
