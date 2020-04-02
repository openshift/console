import * as React from 'react';
import { Firehose, FirehoseResource } from '@console/internal/components/utils';
import { PodRingResources, PodRingData } from '../../types';
import { transformPodRingData } from '../../utils';

interface RenderPropsType {
  loaded: boolean;
  loadError: any;
  data: PodRingData;
}

interface ControllerProps {
  loaded?: boolean;
  loadError?: any;
  resources?: PodRingResources;
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
      prop: 'replicaSets',
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
  } else if (kind === 'StatefulSet') {
    resources.push({
      isList: true,
      kind: 'StatefulSet',
      namespace,
      prop: 'statefulSets',
    });
  }

  return (
    <Firehose resources={resources}>
      <Controller render={render} kind={kind} />
    </Firehose>
  );
};

export default React.memo(PodRingController);
