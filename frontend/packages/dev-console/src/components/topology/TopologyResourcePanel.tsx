import * as React from 'react';
import { ResourceOverviewPage } from '@console/internal/components/overview/resource-overview-page';
import {
  DeploymentConfigModel,
  DeploymentModel,
  DaemonSetModel,
  StatefulSetModel,
  RouteModel,
  ServiceModel,
  BuildConfigModel,
} from '@console/internal/models';
import {
  ConfigurationModel,
  RouteModel as ServerlessRouteModel,
  RevisionModel,
} from '@console/knative-plugin';
import { ResourceProps } from '@console/shared';
import { TopologyDataObject } from './topology-types';

export type TopologyResourcePanelProps = {
  item: TopologyDataObject;
};

const possibleKinds = [
  DeploymentConfigModel.kind,
  DeploymentModel.kind,
  DaemonSetModel.kind,
  StatefulSetModel.kind,
];

/**
 * REMOVE: once we get labels in place
 * This is a temporary check to avoid the `Warning: Each child in an array or iterator should have a unique "key" prop`.
 * Its coming when buildConfig/route/service metadata is empty object,
 * BuildOverviewList, RouteOverviewList, ServiceOverview list uses the metadata.uid as the value of `key` prop.
 *
 * Datacontroller get the buildConfigs based on apps.kubernetes.io/instance label which is not applied to apps created using browser catalog
 */

function metadataUIDCheck(items: ResourceProps[]): ResourceProps[] {
  return items.filter((item) => item.metadata && item.metadata.uid);
}

const TopologyResourcePanel: React.FC<TopologyResourcePanelProps> = ({ item }) => {
  let resourceItemToShowOnSideBar;
  if (!item) {
    return null;
  }

  const dc = item.resources.filter(({ kind }) => possibleKinds.includes(kind));
  const routes = metadataUIDCheck(item.resources.filter(({ kind }) => kind === RouteModel.kind));
  const services = metadataUIDCheck(
    item.resources.filter(({ kind }) => kind === ServiceModel.kind),
  );
  const buildConfigs = metadataUIDCheck(
    item.resources.filter(({ kind }) => kind === BuildConfigModel.kind),
  );

  resourceItemToShowOnSideBar = {
    obj: { apiVersion: 'apps.openshift.io/v1', ...dc[0] },
    kind: dc[0].kind,
    routes,
    services,
    buildConfigs,
    pods: item.pods,
  };

  const ksroutes = metadataUIDCheck(
    item.resources.filter(
      (o) =>
        o.kind === ServerlessRouteModel.kind &&
        o.apiVersion === `${ServerlessRouteModel.apiGroup}/${ServerlessRouteModel.apiVersion}`,
    ),
  );
  const configurations = metadataUIDCheck(
    item.resources.filter(
      (o) =>
        o.kind === ConfigurationModel.kind &&
        o.apiVersion === `${ConfigurationModel.apiGroup}/${ConfigurationModel.apiVersion}`,
    ),
  );
  const revisions = metadataUIDCheck(
    item.resources.filter(
      (o) =>
        o.kind === RevisionModel.kind &&
        o.apiVersion === `${RevisionModel.apiGroup}/${RevisionModel.apiVersion}`,
    ),
  );

  if (configurations.length) {
    resourceItemToShowOnSideBar = {
      ...resourceItemToShowOnSideBar,
      ...{ ksroutes, configurations, revisions },
    };
  }

  if (resourceItemToShowOnSideBar) {
    return (
      <ResourceOverviewPage
        item={resourceItemToShowOnSideBar}
        kind={resourceItemToShowOnSideBar.kind}
      />
    );
  }

  return null;
};

export default TopologyResourcePanel;
