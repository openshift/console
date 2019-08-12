import * as React from 'react';
import { Firehose, FirehoseResource } from '@console/internal/components/utils';
import { Pod, Resource } from '../../types';
import { transformPodRingData } from '../../utils';

interface PodRingDataResources {
  replicationControllers: Resource;
  pods: Resource;
  replicasets: Resource;
  DeploymentConfig: Resource;
  Deployment: Resource;
}

interface RenderPropsType {
  loaded: boolean;
  loadError: any;
  data: {
    [name: string]: {
      pods: Pod[];
    };
  };
}

interface ControllerProps {
  loaded?: boolean;
  loadError?: any;
  resources?: PodRingDataResources;
  kind: string;
  render(RenderProps: RenderPropsType): React.ReactElement;
}

interface PodRingDataControllerProps {
  namespace: string;
  kind: string;
  render(RenderProps: RenderPropsType): React.ReactElement;
}

const Controller: React.FC<ControllerProps> = React.memo(
  ({ resources, render, loaded, loadError, kind }) => {
    return render({
      loaded,
      loadError,
      data: loaded ? transformPodRingData(resources, kind) : null,
    });
  },
);

const PodRingController: React.FC<PodRingDataControllerProps> = ({ namespace, kind, render }) => {
  const resources: FirehoseResource[] = [
    {
      isList: true,
      kind: 'Pod',
      namespace,
      prop: 'pods',
    },
    {
      isList: true,
      kind: 'ReplicaSet',
      namespace,
      prop: 'replicasets',
    },
    {
      isList: true,
      kind: 'ReplicationController',
      namespace,
      prop: 'replicationControllers',
    },
  ];

  if (kind === 'Deployment') {
    resources.push({
      isList: true,
      kind: 'Deployment',
      namespace,
      prop: 'deployments',
    });
  } else if (kind === 'DeploymentConfig') {
    resources.push({
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      prop: 'deploymentConfigs',
    });
  }

  return (
    <Firehose resources={resources} forceUpdate>
      <Controller render={render} kind={kind} />
    </Firehose>
  );
};

export default React.memo(PodRingController);
