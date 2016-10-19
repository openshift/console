import React from 'react';

import {angulars, register} from './react-wrapper';

import {ConfigMaps} from './configmap';
import {DaemonSets} from './daemonset';
import {DeploymentList} from './deployment';
import {HorizontalPodAutoscalersList} from './horizontal-pod-autoscaler';
import {JobsList} from './job';
import {NamespacesList} from './namespace';
import {NodesListSearch} from './node';
import {PodList} from './pod';
import {ReplicaSetsList} from './replicaset';
import {ReplicationControllersList} from './replication-controller';
import {SecretsList} from './secret';
import {ServiceAccountsList} from './service-account';
import {ServicesList} from './service';
import {Dropdown, ResourceIcon} from './utils';

export const ResourceListDropdown = ({selected, onKindChange}) => {
  const ks = angulars.k8s.enum.Kind;
  const kinds = _.fromPairs(_.map([
    ks.DEPLOYMENT,
    ks.SERVICE,
    ks.JOB,
    ks.REPLICASET,
    ks.DAEMONSET,
    ks.REPLICATIONCONTROLLER,
    ks.HORIZONTALPODAUTOSCALER,
    ks.POD,
    ks.SERVICEACCOUNT,
    ks.CONFIGMAP,
    ks.SECRET,
    ks.NAMESPACE,
    ks.NODE,
  ], k => [k.id, <span><div className="co-type-selector__icon-wrapper"><ResourceIcon kind={k.id} /></div>{k.labelPlural}</span>]));

  return <Dropdown className="co-type-selector" items={kinds} title={kinds[selected]} onChange={onKindChange} />;
}

export const ResourceList = (props) => {
  const {kind} = props;

  return <div className="co-m-pane__body">
    <div className="co-m-resource-list">
      {kind === 'deployment'              && <DeploymentList {...props} />}
      {kind === 'service'                 && <ServicesList {...props} />}
      {kind === 'job'                     && <JobsList {...props} />}
      {kind === 'replicaset'              && <ReplicaSetsList {...props} />}
      {kind === 'daemonset'               && <DaemonSets {...props} />}
      {kind === 'replicationcontroller'   && <ReplicationControllersList {...props} />}
      {kind === 'horizontalpodautoscaler' && <HorizontalPodAutoscalersList {...props} />}
      {kind === 'pod'                     && <PodList {...props} />}
      {kind === 'serviceaccount'          && <ServiceAccountsList {...props} />}
      {kind === 'configmap'               && <ConfigMaps {...props} />}
      {kind === 'secret'                  && <SecretsList {...props} />}
      {kind === 'namespace'               && <NamespacesList {...props} namespace={null} />}
      {kind === 'node'                    && <NodesListSearch {...props} namespace={null} />}
    </div>
  </div>;
}

register('ResourceList', ResourceList);
register('ResourceListDropdown', ResourceListDropdown);
