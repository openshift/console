import React from 'react';

import {register} from './react-wrapper';

import {ConfigMaps} from './configmap';
import {DaemonSets} from './daemonset';
import {DeploymentList} from './deployment';
import {HorizontalPodAutoscalersList} from './horizontal-pod-autoscaler';
import {JobsList} from './job';
import {NamespacesList} from './namespace';
import {NodesList} from './node';
import {PodList} from './pod';
import {ReplicaSetsList} from './replicaset';
import {ReplicationControllersList} from './replication-controller';
import {SecretsList} from './secret';
import {ServiceAccountsList} from './service-account';
import {ServicesList} from './service';

export const ResourceList = (props) => {
  const {kind} = props;

  return <div className="co-m-resource-list">
    {kind === 'configmap'               && <ConfigMaps {...props} />}
    {kind === 'daemonset'               && <DaemonSets {...props} />}
    {kind === 'deployment'              && <DeploymentList {...props} />}
    {kind === 'horizontalpodautoscaler' && <HorizontalPodAutoscalersList {...props} />}
    {kind === 'job'                     && <JobsList {...props} />}
    {kind === 'namespace'               && <NamespacesList {...props} namespace={null} />}
    {kind === 'node'                    && <NodesList {...props} namespace={null} />}
    {kind === 'pod'                     && <PodList {...props} />}
    {kind === 'replicaset'              && <ReplicaSetsList {...props} />}
    {kind === 'replicationcontroller'   && <ReplicationControllersList {...props} />}
    {kind === 'secret'                  && <SecretsList {...props} />}
    {kind === 'service'                 && <ServicesList {...props} />}
    {kind === 'serviceaccount'          && <ServiceAccountsList {...props} />}
  </div>;
}

register('ResourceList', ResourceList);
