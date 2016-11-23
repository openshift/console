import React from 'react';

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
import {connect, Dropdown, NavTitle, ResourceIcon, SelectorInput} from './utils';

const ResourceListDropdown = ({selected, onChange}) => {
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

  return <Dropdown className="co-type-selector" items={kinds} title={kinds[selected]} onChange={onChange} />;
};

const ResourceList = connect(state => ({namespace: state.UI.get('activeNamespace')}))(
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
    </div>
  </div>;
});

export class SearchPage extends React.Component {
  constructor (props) {
    super(props);
    this.state = {
      kind: angulars.routeParams.kind || 'service',
      tags: angulars.k8s.selector.split(angulars.routeParams.q || ''),
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
    const validTags = _.reject(tags, tag => angulars.k8s.selectorRequirement.fromString(tag) === undefined);
    const selector = angulars.k8s.selector.fromString(validTags.join(','));

    return <div className="co-p-search">
      <NavTitle title="Search" />
      <div className="co-m-pane">
        <div className="co-m-pane__body">
          <div className="input-group">
            <div className="input-group-btn">
              <ResourceListDropdown selected={kind} onChange={this.handleKindChange.bind(this)} />
            </div>
            <SelectorInput tags={validTags} onChange={this.handleSelectorChange.bind(this)} />
          </div>
        </div>
        <ResourceList kind={kind} selector={selector} />
      </div>
    </div>;
  }
}

register('SearchPage', SearchPage);
