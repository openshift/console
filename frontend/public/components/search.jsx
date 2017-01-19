import React from 'react';

import {k8sKinds} from '../module/k8s';
import {angulars, register} from './react-wrapper';
import {ConfigMaps} from './configmap';
import {DaemonSets} from './daemonset';
import {DeploymentsList} from './deployment';
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
import {IngressList} from './ingress';
import {getActiveNamespace} from '../ui/ui-actions';
import {connect, Dropdown, kindObj, NavTitle, ResourceIcon, SelectorInput} from './utils';

import * as k8sSelector from '../module/k8s/selector';
import * as k8sSelectorRequirement from '../module/k8s/selector-requirement';

const ResourceListDropdown = ({selected, onChange}) => {
  const kinds = _.fromPairs(_.map([
    k8sKinds.DEPLOYMENT,
    k8sKinds.SERVICE,
    k8sKinds.JOB,
    k8sKinds.REPLICASET,
    k8sKinds.DAEMONSET,
    k8sKinds.REPLICATIONCONTROLLER,
    k8sKinds.HORIZONTALPODAUTOSCALER,
    k8sKinds.POD,
    k8sKinds.SERVICEACCOUNT,
    k8sKinds.CONFIGMAP,
    k8sKinds.SECRET,
    k8sKinds.NAMESPACE,
    k8sKinds.NODE,
    k8sKinds.INGRESS
  ], k => [k.id, <span><div className="co-type-selector__icon-wrapper"><ResourceIcon kind={k.id} /></div>{k.labelPlural}</span>]));

  return <Dropdown className="co-type-selector" items={kinds} title={kinds[selected]} onChange={onChange} />;
};

const ResourceList = connect(() => ({namespace: getActiveNamespace()}))(
({kind, namespace, selector}) => {
  const newProps = {namespace, selector};
  return <div className="co-m-pane__body">
    <div className="co-m-resource-list">
      {kind === 'deployment'              && <DeploymentsList {...newProps} />}
      {kind === 'service'                 && <ServicesList {...newProps} />}
      {kind === 'job'                     && <JobsList {...newProps} />}
      {kind === 'replicaset'              && <ReplicaSetsList {...newProps} />}
      {kind === 'daemonset'               && <DaemonSets {...newProps} />}
      {kind === 'replicationcontroller'   && <ReplicationControllersList {...newProps} />}
      {kind === 'horizontalpodautoscaler' && <HorizontalPodAutoscalersList {...newProps} />}
      {kind === 'pod'                     && <PodList {...newProps} />}
      {kind === 'serviceaccount'          && <ServiceAccountsList {...newProps} />}
      {kind === 'configmap'               && <ConfigMaps {...newProps} />}
      {kind === 'secret'                  && <SecretsList {...newProps} />}
      {kind === 'namespace'               && <NamespacesList selector={selector} />}
      {kind === 'node'                    && <NodesListSearch selector={selector} />}
      {kind === 'ingress'                 && <IngressList {...newProps} />}
    </div>
  </div>;
});

export class SearchPage extends React.Component {
  constructor (props) {
    super(props);

    // Ensure that the "kind" route parameter is a valid resource kind ID
    const {id} = kindObj(angulars.routeParams.kind);
    const kind = id || 'service';

    this.state = {
      kind: kind,
      tags: k8sSelector.split(_.isString(angulars.routeParams.q) ? angulars.routeParams.q : ''),
    };
  }

  // TODO(andy): This is a workaround until we decide how we are going to do routing in React
  updateURL () {
    const kind = encodeURIComponent(this.state.kind);
    const q = this.state.tags.map(encodeURIComponent).join(',');
    window.history.pushState({kind, q}, '', `${window.location.pathname}?kind=${kind}&q=${q}`);
  }

  handleKindChange (kind) {
    this.setState({kind}, this.updateURL);
  }

  handleSelectorChange (tags) {
    this.setState({tags}, this.updateURL);
  }

  render () {
    const {kind, tags} = this.state;
    const validTags = _.reject(tags, tag => k8sSelectorRequirement.fromString(tag) === undefined);
    const selector = k8sSelector.fromString(validTags.join(','));

    return <div className="co-p-search">
      <NavTitle title="Search" />
      <div className="co-m-pane">
        <div className="co-m-pane__body">
          <div className="input-group">
            <div className="input-group-btn">
              <ResourceListDropdown selected={kind} onChange={this.handleKindChange.bind(this)} />
            </div>
            <SelectorInput tags={validTags} onChange={this.handleSelectorChange.bind(this)} autoFocus/>
          </div>
        </div>
        <ResourceList kind={kind} selector={selector} />
      </div>
    </div>;
  }
}

register('SearchPage', SearchPage);
