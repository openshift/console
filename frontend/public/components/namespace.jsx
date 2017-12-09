import * as _ from 'lodash';
import * as React from 'react';
import { connect } from 'react-redux';
import { Tooltip } from 'react-lightweight-tooltip';
import { Link } from 'react-router-dom';

import { k8sGet, k8sKinds } from '../module/k8s';
import { UIActions, getActiveNamespace } from '../ui/ui-actions';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { SafetyFirst } from './safety-first';
import { Cog, Dropdown, Firehose, LabelList, LoadingInline, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary, humanizeMem } from './utils';
import { createNamespaceModal, deleteNamespaceModal, configureNamespacePullSecretModal } from './modals';
import { RoleBindingsPage } from './RBAC';
import { Bar, Line } from './graphs';

const deleteModal = (kind, ns) => {
  let {label, weight} = Cog.factory.Delete(kind, ns);
  let callback = undefined;
  let tooltip;

  if (ns.metadata.name === 'default') {
    tooltip = 'Namespace default cannot be deleted';
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

const Header = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="status.phase">Status</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.labels">Labels</ColHead>
</ListHeader>;

const Row = ({obj: ns}) => <ResourceRow obj={ns}>
  <div className="col-xs-4">
    <ResourceCog actions={menuActions} kind="Namespace" resource={ns} />
    <ResourceLink kind="Namespace" name={ns.metadata.name} title={ns.metadata.uid} />
  </div>
  <div className="col-xs-4">
    {ns.status.phase}
  </div>
  <div className="col-xs-4">
    <LabelList kind="Namespace" labels={ns.metadata.labels} />
  </div>
</ResourceRow>;

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
    k8sGet(k8sKinds.Secret, null, namespaceName, {queryParams: {fieldSelector: 'type=kubernetes.io/dockerconfigjson'}})
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

const Details = ({obj: ns}) => <div>
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
          <dt>Network Policies</dt>
          <dd>
            <Link to={`/ns/${ns.metadata.name}/networkpolicies`}>Network Policies</Link>
          </dd>
        </dl>
      </div>
    </div>
  </div>
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-xs-12">
        <h1 className="co-m-pane__title">Resource Usage</h1>
      </div>
    </div>
    <div className="row">
      <div className="col-sm-6 col-xs-12">
        <Line title="CPU Shares" query={[
          {
            name: 'Used',
            query: `namespace:container_spec_cpu_shares:sum{namespace='${ns.metadata.name}'}`,
          },
        ]} />
      </div>
      <div className="col-sm-6 col-xs-12">
        <Line title="RAM" query={[
          {
            name: 'Used',
            query: `namespace:container_memory_usage_bytes:sum{namespace='${ns.metadata.name}'}`,
          },
        ]} />
      </div>
    </div>

    <br />

    <div className="row">
      <div className="col-sm-12 col-xs-12">
        <Bar title="Memory Usage by Pod (Top 10)" query={`sort(topk(10, sum by (pod_name)(container_memory_usage_bytes{pod_name!="", namespace="${ns.metadata.name}"})))`} humanize={humanizeMem} metric="pod_name" />
      </div>
    </div>
  </div>
</div>;

const RolesPage = ({obj: {metadata}}) => <RoleBindingsPage namespace={metadata.name} showTitle={false} />;

const NamespaceDropdown = connect(() => ({activeNamespace: getActiveNamespace()}))(props => {
  const { activeNamespace, dispatch } = props;

  const {loaded, data} = props.namespace;
  // Use a key for the "all" namespaces option that would be an invalid namespace name to avoid a potential clash
  const allNamespacesKey = '#ALL_NS#';

  const items = {};
  items[allNamespacesKey] = 'all';
  _.map(data, 'metadata.name').sort().forEach(name => items[name] = name);

  let title = activeNamespace || 'all';

  // If the currently active namespace is not found in the list of all namespaces, default to "all"
  if (loaded && !_.has(items, title)) {
    title = 'all';
  }

  const onChange = (newNamespace) => {
    dispatch(UIActions.setActiveNamespace(newNamespace === allNamespacesKey ? undefined : newNamespace));
  };

  return <div className="co-namespace-selector">
    Namespace: <Dropdown className="co-namespace-selector__dropdown" noButton={true} items={items} title={title} onChange={onChange} selectedKey={activeNamespace || allNamespacesKey} />
  </div>;
});

const resources = [{
  kind: 'Namespace',
  prop: 'namespace',
  isList: true,
}];

export const NamespaceSelector = () => <Firehose resources={resources}>
  <NamespaceDropdown />
</Firehose>;

export const NamespacesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={menuActions}
  pages={[navFactory.details(Details), navFactory.editYaml(), navFactory.roles(RolesPage)]}
/>;
