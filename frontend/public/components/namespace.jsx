import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Tooltip } from './utils/tooltip';
import { Link } from 'react-router-dom';
import * as fuzzy from 'fuzzysearch';

import { NamespaceModel, ProjectModel, SecretModel } from '../models';
import { k8sGet } from '../module/k8s';
import { UIActions } from '../ui/ui-actions';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { SafetyFirst } from './safety-first';
import { Cog, Dropdown, Firehose, LabelList, LoadingInline, navFactory, ResourceCog, Heading, ResourceLink, ResourceSummary, humanizeMem } from './utils';
import { createNamespaceModal, createProjectModal, deleteNamespaceModal, configureNamespacePullSecretModal } from './modals';
import { RoleBindingsPage } from './RBAC';
import { Bar, Line } from './graphs';
import { NAMESPACE_LOCAL_STORAGE_KEY, ALL_NAMESPACES_KEY } from '../const';
import { FLAGS, connectToFlags, featureReducerName } from '../features';

const getModel = useProjects => useProjects ? ProjectModel : NamespaceModel;
const getDisplayName = obj => _.get(obj, ['metadata', 'annotations', 'openshift.io/display-name']);
const getRequester = obj => _.get(obj, ['metadata', 'annotations', 'openshift.io/requester']);

const deleteModal = (kind, ns) => {
  let {label, weight} = Cog.factory.Delete(kind, ns);
  let callback = undefined;
  let tooltip;

  if (ns.metadata.name === 'default') {
    tooltip = `${kind.label} default cannot be deleted`;
  } else if (ns.status.phase === 'Terminating') {
    tooltip = `${kind.label} is already terminating`;
  } else {
    callback = () => deleteNamespaceModal({kind, resource: ns});
  }
  if (tooltip) {
    label = <div className="dropdown__disabled">
      <Tooltip content={tooltip}>{label}</Tooltip>
    </div>;
  }
  return {label, weight, callback};
};

const nsMenuActions = [Cog.factory.ModifyLabels, Cog.factory.ModifyAnnotations, Cog.factory.Edit, deleteModal];

const NamespaceHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="status.phase">Status</ColHead>
  <ColHead {...props} className="col-xs-4" sortField="metadata.labels">Labels</ColHead>
</ListHeader>;

const NamespaceRow = ({obj: ns}) => <ResourceRow obj={ns}>
  <div className="col-xs-4">
    <ResourceCog actions={nsMenuActions} kind="Namespace" resource={ns} />
    <ResourceLink kind="Namespace" name={ns.metadata.name} title={ns.metadata.uid} />
  </div>
  <div className="col-xs-4">
    {ns.status.phase}
  </div>
  <div className="col-xs-4">
    <LabelList kind="Namespace" labels={ns.metadata.labels} />
  </div>
</ResourceRow>;

export const NamespacesList = props => <List {...props} Header={NamespaceHeader} Row={NamespaceRow} />;
export const NamespacesPage = props => <ListPage {...props} ListComponent={NamespacesList} canCreate={true} createHandler={createNamespaceModal} />;

const projectMenuActions = [Cog.factory.Edit, deleteModal];

const ProjectHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-3 col-xs-4" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-3 col-xs-4" sortField="status.phase">Status</ColHead>
  <ColHead {...props} className="col-sm-3 col-xs-4" sortField="metadata.annotations.['openshift.io/requester']">Requester</ColHead>
  <ColHead {...props} className="col-sm-3 hidden-xs" sortField="metadata.labels">Labels</ColHead>
</ListHeader>;

const ProjectRow = ({obj: project}) => {
  const displayName = getDisplayName(project);
  const requester = getRequester(project);
  return <ResourceRow obj={project}>
    <div className="col-sm-3 col-xs-4">
      <ResourceCog actions={projectMenuActions} kind="Project" resource={project} />
      <ResourceLink kind="Project" name={project.metadata.name} title={displayName || project.metadata.uid} />
    </div>
    <div className="col-sm-3 col-xs-4">
      {project.status.phase}
    </div>
    <div className="col-sm-3 col-xs-4">
      {requester || <span className="text-muted">No requester</span>}
    </div>
    <div className="col-sm-3 hidden-xs">
      <LabelList kind="Project" labels={project.metadata.labels} />
    </div>
  </ResourceRow>;
};

export const ProjectList = props => <List {...props} Header={ProjectHeader} Row={ProjectRow} />;
export const ProjectsPage = props => <ListPage {...props} ListComponent={ProjectList} canCreate={true} createHandler={createProjectModal} />;


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
    k8sGet(SecretModel, null, namespaceName, {queryParams: {fieldSelector: 'type=kubernetes.io/dockerconfigjson'}})
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

const Details = ({obj: ns}) => {
  const displayName = getDisplayName(ns);
  const requester = getRequester(ns);
  return <div>
    <div className="co-m-pane__body">
      <Heading text="Namespace Overview" />
      <div className="row">
        <div className="col-sm-6 col-xs-12">
          <ResourceSummary resource={ns} showPodSelector={false} showNodeSelector={false}>
            {displayName && <dt>Display Name</dt>}
            {displayName && <dd>{displayName}</dd>}
            {requester && <dt>Requester</dt>}
            {requester && <dd>{requester}</dd>}
          </ResourceSummary>
        </div>
        <div className="col-sm-6 col-xs-12">
          <dl className="co-m-pane__details">
            <dt>Status</dt>
            <dd>{ns.status.phase}</dd>
            <dt>Default Pull Secret</dt>
            <dd><PullSecret namespace={ns} /></dd>
            <dt>Network Policies</dt>
            <dd>
              <Link to={`/k8s/ns/${ns.metadata.name}/networkpolicies`}>Network Policies</Link>
            </dd>
          </dl>
        </div>
      </div>
    </div>
    <div className="co-m-pane__body">
      <Heading text="Resource Usage" />
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
      <Bar title="Memory Usage by Pod (Top 10)" query={`sort(topk(10, sum by (pod_name)(container_memory_usage_bytes{pod_name!="", namespace="${ns.metadata.name}"})))`} humanize={humanizeMem} metric="pod_name" />
    </div>
  </div>;
};

const RolesPage = ({obj: {metadata}}) => <RoleBindingsPage namespace={metadata.name} showTitle={false} />;

const autocompleteFilter = (text, item) => fuzzy(text, item);

const defaultBookmarks = {};

const namespaceDropdownStateToProps = state => {
  const activeNamespace = state.UI.get('activeNamespace');
  const canListNS = state[featureReducerName].get(FLAGS.CAN_LIST_NS);

  return { activeNamespace, canListNS };
};

const NamespaceDropdown = connect(namespaceDropdownStateToProps)(props => {
  const { activeNamespace, dispatch, canListNS, useProjects } = props;
  if (canListNS === undefined) {
    return null;
  }

  const { loaded, data } = props.namespace;
  const model = getModel(useProjects);
  const allNamespacesTitle = `all ${model.labelPlural.toLowerCase()}`;
  const items = {};
  if (canListNS) {
    items[ALL_NAMESPACES_KEY] = allNamespacesTitle;
  }
  _.map(data, 'metadata.name').sort().forEach(name => items[name] = name);

  let title = activeNamespace;
  if (activeNamespace === ALL_NAMESPACES_KEY) {
    title = allNamespacesTitle;
  } else if (loaded && !_.has(items, title)) {
    // If the currently active namespace is not found in the list of all namespaces, put it in anyway
    items[title] = title;
  }

  const onChange = newNamespace => dispatch(UIActions.setActiveNamespace(newNamespace));

  return <div className="co-namespace-selector">
    <span>{model.label}:</span>
    <Dropdown
      className="co-namespace-selector__dropdown"
      menuClassName="co-namespace-selector__menu"
      noButton
      canFavorite
      items={items}
      title={title}
      onChange={onChange}
      selectedKey={activeNamespace || ALL_NAMESPACES_KEY}
      autocompleteFilter={autocompleteFilter}
      autocompletePlaceholder={`Select ${model.label.toLowerCase()}...`}
      defaultBookmarks={defaultBookmarks}
      storageKey={NAMESPACE_LOCAL_STORAGE_KEY}
      shortCut="n" />
  </div>;
});

const NamespaceSelector_ = ({flags}) => {
  const openshiftFlag = flags[FLAGS.OPENSHIFT];
  if (openshiftFlag === undefined) {
    // Wait until the flag is initialized.
    return <div className="co-namespace-selector" />;
  }

  const model = getModel(openshiftFlag);
  const resources = [{ kind: model.kind, prop: 'namespace', isList: true }];

  return <Firehose resources={resources}>
    <NamespaceDropdown useProjects={openshiftFlag} />
  </Firehose>;
};

export const NamespaceSelector = connectToFlags(FLAGS.OPENSHIFT)(NamespaceSelector_);

export const NamespacesDetailsPage = props => <DetailsPage
  {...props}
  menuActions={nsMenuActions}
  pages={[navFactory.details(Details), navFactory.editYaml(), navFactory.roles(RolesPage)]}
/>;

export const ProjectsDetailsPage = props => <DetailsPage
  {...props}
  menuActions={projectMenuActions}
  pages={[navFactory.details(Details), navFactory.editYaml(), navFactory.roles(RolesPage)]}
/>;
