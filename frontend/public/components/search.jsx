import * as React from 'react';
import {connect} from 'react-redux';
import * as Helmet from 'react-helmet';

import {ConfigMaps} from './configmap';
import {DaemonSets} from './daemonset';
import {DeploymentsList} from './deployment';
import {JobsList} from './job';
import {NamespacesList} from './namespace';
import {NodesListSearch} from './node';
import {PodList} from './pod';
import {ReplicaSetsList} from './replicaset';
import {ReplicationControllersList} from './replication-controller';
import {SecretsList} from './secret';
import {ServiceAccountsList} from './service-account';
import {ServicesList} from './service';
import {IngressesList} from './ingress';
import {PrometheusInstancesList} from './prometheus';
import {ServiceMonitorsList} from './service-monitor';
import {AlertManagersList} from './alert-manager';
import {getActiveNamespace} from '../ui/ui-actions';
import {Dropdown, Firehose, kindObj, history, NavTitle, ResourceIcon, SelectorInput} from './utils';

import * as k8sSelector from '../module/k8s/selector';
import * as k8sSelectorRequirement from '../module/k8s/selector-requirement';

// Map resource kind IDs to their list components
const resources = {
  ConfigMap: ConfigMaps,
  DaemonSet: DaemonSets,
  Deployment: DeploymentsList,
  Ingress: IngressesList,
  Job: JobsList,
  Namespace: NamespacesList,
  Node: NodesListSearch,
  Pod: PodList,
  ReplicaSet: ReplicaSetsList,
  ReplicationController: ReplicationControllersList,
  Secret: SecretsList,
  ServiceAccount: ServiceAccountsList,
  Service: ServicesList,
  Prometheus: PrometheusInstancesList,
  ServiceMonitor: ServiceMonitorsList,
  Alertmanager: AlertManagersList,
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
  ({kind, namespace, selector}) => {
    const List = resources[kind];
    const ns = kind === 'Node' || kind === 'Namespace' ? undefined : namespace;

    return <div className="co-m-pane__body">
      {List && <div className="co-m-resource-list">
        <Firehose isList={true} kind={kind} namespace={ns} selector={selector}>
          <List />
        </Firehose>
      </div>}
    </div>;
  });

const updateUrlParams = (k, v) => {
  const url = new URL(window.location);
  url.searchParams.set(k, v);
  history.push(`${url.pathname}${url.search}${url.hash}`);
};

const updateKind = kind => updateUrlParams('kind', encodeURIComponent(kind));
const updateTags = tags => updateUrlParams('q', tags.map(encodeURIComponent).join(','));

export const SearchPage = ({match, location}) => {
  const { params } = match;
  let kind, q;
  if (location.search) {
    const u = new URL(window.location);
    kind = u.searchParams.get('kind');
    q = u.searchParams.get('q');
  }

  // Ensure that the "kind" route parameter is a valid resource kind ID
  kind = kind ? decodeURIComponent(kind) : 'Service';

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
        <div className="input-group">
          <div className="input-group-btn">
            <ResourceListDropdown selected={kind} onChange={updateKind} />
          </div>
          <SelectorInput labelClassName={`co-text-${_.toLower(kind)}`} tags={validTags} onChange={updateTags} autoFocus/>
        </div>
      </div>
      <ResourceList kind={kind} selector={selector} />
    </div>
  </div>;
};
