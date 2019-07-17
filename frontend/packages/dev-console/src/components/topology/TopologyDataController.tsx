import * as React from 'react';
import { Firehose } from '@console/internal/components/utils';
import { TopologyDataResources, TopologyDataModel } from './topology-types';
import { TransformTopologyData } from './topology-utils';

export interface RenderProps {
  data?: TopologyDataModel;
  loaded: boolean;
  loadError: any;
}

export interface ControllerProps {
  loaded?: boolean;
  loadError?: any;
  resources?: TopologyDataResources;
  render(RenderProps): React.ReactElement;
  application: string;
}

export interface TopologyDataControllerProps {
  namespace: string;
  render(RenderProps): React.ReactElement;
  application: string;
}

const Controller: React.FC<ControllerProps> = React.memo(
  ({ render, application, resources, loaded, loadError }) =>
    render({
      loaded,
      loadError,
      data: loaded
        ? new TransformTopologyData(resources, application)
            .transformDataBy('deployments')
            .transformDataBy('deploymentConfigs')
            .transformDataBy('daemonSets')
            .getTopologyData()
        : null,
    }),
);

const TopologyDataController: React.FC<TopologyDataControllerProps> = ({
  namespace,
  render,
  application,
}) => {
  const resources = [
    {
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      prop: 'deploymentConfigs',
    },
    {
      isList: true,
      kind: 'Deployment',
      namespace,
      prop: 'deployments',
    },
    {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      prop: 'daemonSets',
    },
    {
      isList: true,
      kind: 'Pod',
      namespace,
      prop: 'pods',
    },
    {
      isList: true,
      kind: 'ReplicationController',
      namespace,
      prop: 'replicationControllers',
    },
    {
      isList: true,
      kind: 'Route',
      namespace,
      prop: 'routes',
    },
    {
      isList: true,
      kind: 'Service',
      namespace,
      prop: 'services',
    },
    {
      isList: true,
      kind: 'ReplicaSet',
      namespace,
      prop: 'replicasets',
    },
    {
      isList: true,
      kind: 'BuildConfig',
      namespace,
      prop: 'buildconfigs',
    },
    {
      isList: true,
      kind: 'Build',
      namespace,
      prop: 'builds',
    },
  ];
  return (
    <Firehose resources={resources} forceUpdate>
      <Controller application={application} render={render} />
    </Firehose>
  );
};

export default React.memo(TopologyDataController);
