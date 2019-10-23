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
  PersistentVolumeClaimModel,
  ServiceModel,
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
import { K8sKind } from '../../../module/k8s';
import { getName } from '@console/shared';
import { ProjectDashboardContext } from './project-dashboard-context';

const createFirehoseResource = (model: K8sKind, projectName: string): FirehoseResource => ({
  kind: model.kind,
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
  }: ProjectInventoryItemProps) => {
    React.useEffect(() => {
      if (projectName) {
        const resource = createFirehoseResource(model, projectName);
        watchK8sResource(resource);
        return () => stopWatchK8sResource(resource);
      }
    }, [watchK8sResource, stopWatchK8sResource, projectName, model]);

    const resourceData = _.get(resources.resource, 'data', []) as FirehoseResult['data'];
    const resourceLoaded = _.get(resources.resource, 'loaded');
    const resourceLoadError = _.get(resources.resource, 'loadError');
    return (
      <ResourceInventoryItem
        kind={model}
        isLoading={!projectName || !resourceLoaded}
        namespace={projectName}
        error={!!resourceLoadError}
        resources={resourceData}
        mapper={mapper}
        useAbbr={useAbbr}
      />
    );
  },
);

export const InventoryCard: React.FC = () => {
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
      </DashboardCardBody>
    </DashboardCard>
  );
};

type ProjectInventoryItemProps = DashboardItemProps & {
  projectName: string;
  model: K8sKind;
  mapper?: StatusGroupMapper;
  useAbbr?: boolean;
};
