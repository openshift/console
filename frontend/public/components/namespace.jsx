import React from 'react';
import { connect } from 'react-redux';
import { Tooltip } from 'react-lightweight-tooltip';

import {k8s, k8sEnum} from '../module/k8s';
import {actions, getActiveNamespace, isNamespaced} from '../ui/ui-actions';
import {DetailsPage, List, ListPage} from './factory';
import {SafetyFirst} from './safety-first';
import {SparklineWidget} from './sparkline-widget/sparkline-widget';
import {Cog, Dropdown, Firehose, LabelList, LoadingInline, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary} from './utils';
import {createNamespaceModal, deleteNamespaceModal, configureNamespacePullSecretModal} from './modals';
import {BindingName, BindingRows, EmptyMsg, RoleLink} from './RBAC';

const deleteModal = (kind, ns) => {
  let {label, weight} = Cog.factory.Delete(kind, ns);
  let callback = undefined;
  let tooltip;

  if (ns.metadata.name === k8sEnum.DefaultNS) {
    tooltip = `Namespace "${k8sEnum.DefaultNS}" cannot be deleted`;
  } else if (ns.status.phase === 'Terminating') {
    tooltip = 'Namespace is already terminating';
  } else {
    callback = () => deleteNamespaceModal({resource: ns});
  }
  if (tooltip) {
    label = <div className="dropdown__disabled">
      <Tooltip content={tooltip}>{label}</Tooltip>
    </div>;
  }
  return {label, weight, callback};
};

const menuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, deleteModal];

const Header = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-4">Name</div>
  <div className="col-xs-4">Status</div>
  <div className="col-xs-4">Labels</div>
</div>;

const Row = ({obj: ns}) => <div className="row co-resource-list__item">
  <div className="col-xs-4">
    <ResourceCog actions={menuActions} kind="namespace" resource={ns} />
    <ResourceLink kind="namespace" name={ns.metadata.name} title={ns.metadata.uid} />
  </div>
  <div className="col-xs-4">
    {ns.status.phase}
  </div>
  <div className="col-xs-4">
    <LabelList kind="namespace" labels={ns.metadata.labels} />
  </div>
</div>;

export const NamespacesList = props => <List {...props} Header={Header} Row={Row} />;
export const NamespacesPage = props => <ListPage {...props} ListComponent={NamespacesList} canCreate={true} createHandler={createNamespaceModal} />;

class PullSecret extends SafetyFirst {
  constructor (props) {
    super(props);
    this.state = {isLoading: true, data: undefined};
  }

  componentDidMount () {
    super.componentDidMount();
    this.load(_.get(this.props, 'namespace.metadata.name'));
  }

  load (namespaceName) {
    if (!namespaceName) {
      return;
    }
    const args = `?fieldSelector=${encodeURIComponent('type=kubernetes.io/dockerconfigjson')}`;
    k8s.secrets.get(args, namespaceName)
      .then((pullSecrets) => {
        this.setState({isLoading: false, data: _.get(pullSecrets, 'items[0]')});
      })
      .catch((error) => {
        this.setState({isLoading: false, data: undefined});

        // A 404 just means that no pull secrets exist
        if (error.status !== 404) {
          throw error;
        }
      });
  }

  render () {
    if (this.state.isLoading) {
      return <LoadingInline />;
    }
    const modal = () => configureNamespacePullSecretModal({namespace: this.props.namespace, pullSecret: this.state.data});
    return <a className="co-m-modal-link" onClick={modal}>{_.get(this.state.data, 'metadata.name') || 'Not Configured'}</a>;
  }
}

const Details = (ns) => {
  if (_.isEmpty(ns)) {
    return <div className="empty-page">
      <h1 className="empty-page__header">No namespace selected</h1>
      <p className="empty-page__explanation">Namespaces organize and isolate your cluster resources from other things running on the cluster.</p>
    </div>;
  }

  return <div>
    <Heading text="Namespace Overview" />
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-sm-6 col-xs-12">
          <ResourceSummary resource={ns} showPodSelector={false} showNodeSelector={false} />
        </div>
        <div className="col-sm-6 col-xs-12">
          <dl>
            <dt>Status</dt>
            <dd>{ns.status.phase}</dd>
            <dt>Default Pull Secret</dt>
            <dd><PullSecret namespace={ns} /></dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <div className="row">
        <div className="col-xs-12">
          <h1 className="co-m-pane__title">Resource Usage</h1>
        </div>
        <div className="col-sm-6 col-xs-12 co-namespace-sparkline">
          <SparklineWidget heading="CPU Shares" query={`namespace:container_spec_cpu_shares:sum{namespace='${ns.metadata.name}'} * 1000000`} limitQuery="sum(namespace:container_spec_cpu_shares:sum) * 1000000" limitText="cluster" units="numeric" />
        </div>
        <div className="col-sm-6 col-xs-12 co-namespace-sparkline">
          <SparklineWidget heading="RAM" query={`namespace:container_memory_usage_bytes:sum{namespace='${ns.metadata.name}'}`} limitQuery="sum(namespace:container_memory_usage_bytes:sum)" limitText="cluster" units="binaryBytes" />
        </div>
      </div>
    </div>
  </div>;
};

const RoleHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-xs-3">Name</div>
  <div className="col-xs-3">Role Ref</div>
  <div className="col-xs-2">Subject Kind</div>
  <div className="col-xs-4">Subject Name</div>
</div>;

const SubjectRow = ({actions, binding, kind, name}) => <div className="row co-resource-list__item">
  <div className="col-xs-3">
    <BindingName binding={binding} actions={actions} />
  </div>
  <div className="col-xs-3">
    <RoleLink binding={binding} />
  </div>
  <div className="col-xs-2">
    {kind}
  </div>
  <div className="col-xs-4">
    {name}
  </div>
</div>;

const RolesList = props => <List {...props} EmptyMsg={EmptyMsg} Header={RoleHeader} Row={BindingRows(SubjectRow)} />;
const RolesPage = props => {
  const Intro = <div>
    <h1 className="co-m-pane__title">Namespace Role Bindings</h1>
    <div className="co-m-pane__explanation">These subjects have access to resources specifically within this namespace.</div>
  </div>;
  return <ListPage namespace={props.metadata.name} kind="rolebinding" ListComponent={RolesList} Intro={Intro} showTitle={false} textFilter="role-binding" filterLabel="Role Bindings by role or subject" />;
};

const NamespaceDropdown = connect(() => ({namespace: getActiveNamespace()}))(props => {
  const {data, loaded, namespace, dispatch} = props;

  // Use a key for the "all" namespaces option that would be an invalid namespace name to avoid a potential clash
  const allNamespacesKey = '#ALL_NS#';

  const items = {};
  items[allNamespacesKey] = 'all';
  _.map(data, 'metadata.name').sort().forEach(name => items[name] = name);

  let title = namespace || 'all';

  // If the currently active namespace is not found in the list of all namespaces, default to "all"
  if (loaded && !_.has(items, title)) {
    title = 'all';
  }

  const onChange = (newNamespace) => {
    dispatch(actions.setActiveNamespace(newNamespace === allNamespacesKey ? undefined : newNamespace));
  };

  return <div className="co-namespace-selector">
    Namespace: <Dropdown className="co-namespace-selector__dropdown" noButton={true} items={items} title={title} onChange={onChange} />
  </div>;
});

export const NamespaceSelector = () => {
  // Don't show namespace dropdown unless the namespace is relevant to the current page
  if(!isNamespaced(window.location.pathname)) {
    return null;
  }

  return <Firehose kind="namespace" isList={true}>
    <NamespaceDropdown />
  </Firehose>;
};

const pages = [navFactory.details(Details), navFactory.editYaml(), navFactory.roles(RolesPage)];
export const NamespacesDetailsPage = props => <DetailsPage {...props} pages={pages} menuActions={menuActions} />;
