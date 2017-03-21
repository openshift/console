import React from 'react';
import {connect} from 'react-redux';
import Helmet from 'react-helmet';

import store from '../redux';
import {getQN} from '../module/k8s';
import actions from '../module/k8s/k8s-actions';
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
import {Dropdown, kindObj, history, NavTitle, ResourceIcon, SelectorInput, Firehose, StatusBox, WithQuery} from './utils';

import * as k8sSelector from '../module/k8s/selector';
import * as k8sSelectorRequirement from '../module/k8s/selector-requirement';

// Map resource kind IDs to their list components
const resources = {
  configmap: ConfigMaps,
  daemonset: DaemonSets,
  deployment: DeploymentsList,
  horizontalpodautoscaler: HorizontalPodAutoscalersList,
  ingress: IngressList,
  job: JobsList,
  namespace: NamespacesList,
  node: NodesListSearch,
  pod: PodList,
  replicaset: ReplicaSetsList,
  replicationcontroller: ReplicationControllersList,
  secret: SecretsList,
  serviceaccount: ServiceAccountsList,
  service: ServicesList,
};

const DropdownItem = ({kind}) => <span>
  <div className="co-type-selector__icon-wrapper">
    <ResourceIcon kind={kind} />
  </div>
  {kindObj(kind).labelPlural}
</span>;

const ResourceListDropdown = ({selected, onChange}) => {
  const kinds = _.mapValues(resources, (v, k) => <DropdownItem kind={k} />);
  return <Dropdown className="co-type-selector" items={kinds} title={kinds[selected]} onChange={onChange} />;
};

const ResourceList = connect(() => ({namespace: getActiveNamespace()}))(
({kind, namespace, selector, kluster}) => {
  const newProps = {namespace, selector, kluster};
  const List = resources[kind];

  return <div className="co-m-pane__body">
    {List && <div className="co-m-resource-list">
      {kind === 'namespace' || kind === 'node' ? <List selector={selector} kluster={kluster} /> : <List {...newProps} />}
    </div>}
  </div>;
});

const updateUrlParams = (params) => {
  const location = Object.assign({}, history.getCurrentLocation());
  Object.assign(location.query, params);
  history.push(location);
};

const updateKind = kind => updateUrlParams({kind: encodeURIComponent(kind)});
const updateTags = tags => updateUrlParams({q: tags.map(encodeURIComponent).join(',')});


const onClick = (selected, reduxID, qn) => {
  if (selected.has(qn)) {
    selected.delete(qn);
  } else {
    selected.add(qn);
  }
  store.dispatch(actions.selectInList(reduxID, selected));
};
const ClusterSelector = ({data, selected, reduxID}) => {
  selected = new Set(selected);
  const cms = data.map(cm => {
    const name = cm.metadata.name;
    const qn = getQN(cm);
    return <span key={name}>
      <label>
        {name}&nbsp;&nbsp;<input type="checkbox" onChange={() => onClick(selected, reduxID, qn)} checked={!selected.has(qn)}/>
      </label>
      &nbsp;&nbsp;&nbsp;
    </span>;
  });
  return <p>{cms}</p>;
};

const ClusterSearcher = ({data, selected, actualKind, actualSelector}) => {
  if (!data) {
    return <div/>;
  }
  selected = selected || new Set();
  const lists = data.filter(cm => !selected.has(getQN(cm))).map(cm => <div key={cm.data.url}>
    <h3 style={{marginLeft: 30}}>{cm.metadata.name}</h3>
    <ResourceList kind={actualKind} selector={actualSelector} kluster={cm.data} />
  </div>);

  return <div>{lists}</div>;
};

const configmaps = {
  kind: 'configmap',
  isList: true,
  selector: {matchLabels: {app: 'kluster'}},
  namespace: 'default',
};

export const SearchPage = ({params, location}) => {

  const {kind, q} = location.query;

  // Ensure that the "kind" route parameter is a valid resource kind ID
  const {id} = kindObj(decodeURIComponent(kind));
  const kindId = id || 'service';

  const tags = k8sSelector.split(_.isString(q) ? decodeURIComponent(q) : '');
  const validTags = _.reject(tags, tag => k8sSelectorRequirement.fromString(tag) === undefined);
  const selector = k8sSelector.fromString(validTags.join(','));

  // Ensure the list is reloaded whenever the search options are changed
  const key = `${params.ns}-${kind}-${validTags.join(',')}`;

  return <div className="co-p-search">
    <Helmet title="Search" />
    <NavTitle title="Search" />
    <div className="co-m-pane" key={key}>
      <div className="co-m-pane__body">
        <Firehose {...configmaps}>
          <StatusBox>
            <ClusterSelector />
          </StatusBox>
        </Firehose>

        <div className="input-group">
          <div className="input-group-btn">
            <ResourceListDropdown selected={kindId} onChange={updateKind} />
          </div>
          <SelectorInput labelClassName={`co-text-${kindId}`} tags={validTags} onChange={updateTags} autoFocus/>
        </div>
      </div>

      <WithQuery {...configmaps}>
        <ClusterSearcher actualKind={kindId} actualSelector={selector}/>
      </WithQuery>
    </div>
  </div>;
};
