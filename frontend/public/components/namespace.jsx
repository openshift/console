import * as _ from 'lodash-es';
import * as React from 'react';
import { connect } from 'react-redux';
import { Tooltip } from './utils/tooltip';
import { Link } from 'react-router-dom';
import * as fuzzy from 'fuzzysearch';

import { NamespaceModel, ProjectModel, SecretModel } from '../models';
import { k8sGet } from '../module/k8s';
import { formatNamespacedRouteForResource, UIActions } from '../ui/ui-actions';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { SafetyFirst } from './safety-first';
import { ActionsMenu, Kebab, Dropdown, Firehose, LabelList, LoadingInline, navFactory, ResourceKebab, SectionHeading, ResourceIcon, ResourceLink, ResourceSummary, humanizeMem, MsgBox } from './utils';
import { createNamespaceModal, createProjectModal, deleteNamespaceModal, configureNamespacePullSecretModal } from './modals';
import { RoleBindingsPage } from './RBAC';
import { Bar, Line, requirePrometheus } from './graphs';
import { NAMESPACE_LOCAL_STORAGE_KEY, ALL_NAMESPACES_KEY } from '../const';
import { FLAGS, featureReducerName, flagPending, setFlag, connectToFlags } from '../features';
import { openshiftHelpBase } from './utils/documentation';
import { createProjectMessageStateToProps } from '../ui/ui-reducers';

const getModel = useProjects => useProjects ? ProjectModel : NamespaceModel;
const getDisplayName = obj => _.get(obj, ['metadata', 'annotations', 'openshift.io/display-name']);
const getRequester = obj => _.get(obj, ['metadata', 'annotations', 'openshift.io/requester']);

export const deleteModal = (kind, ns) => {
  let {label, weight} = Kebab.factory.Delete(kind, ns);
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

const nsMenuActions = [Kebab.factory.ModifyLabels, Kebab.factory.ModifyAnnotations, Kebab.factory.Edit, deleteModal];

const NamespaceHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-4 col-xs-6" sortField="status.phase">Status</ColHead>
  <ColHead {...props} className="col-sm-4 hidden-xs" sortField="metadata.labels">Labels</ColHead>
</ListHeader>;

const NamespaceRow = ({obj: ns}) => <ResourceRow obj={ns}>
  <div className="col-sm-4 col-xs-6">
    <ResourceLink kind="Namespace" name={ns.metadata.name} title={ns.metadata.uid} />
  </div>
  <div className="col-sm-4 col-xs-6 co-break-word">
    {ns.status.phase}
  </div>
  <div className="col-sm-4 hidden-xs">
    <LabelList kind="Namespace" labels={ns.metadata.labels} />
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={nsMenuActions} kind="Namespace" resource={ns} />
  </div>
</ResourceRow>;

export const NamespacesList = props => <List {...props} Header={NamespaceHeader} Row={NamespaceRow} />;
export const NamespacesPage = props => <ListPage {...props} ListComponent={NamespacesList} canCreate={true} createHandler={createNamespaceModal} />;

const projectMenuActions = [Kebab.factory.Edit, deleteModal];

const ProjectHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-3 col-sm-6 col-xs-8" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-3 col-xs-4" sortField="status.phase">Status</ColHead>
  <ColHead {...props} className="col-md-3 col-sm-3 hidden-xs" sortField="metadata.annotations.['openshift.io/requester']">Requester</ColHead>
  <ColHead {...props} className="col-md-3 hidden-sm hidden-xs" sortField="metadata.labels">Labels</ColHead>
</ListHeader>;

const ProjectRow = ({obj: project}) => {
  const name = project.metadata.name;
  const displayName = getDisplayName(project);
  const requester = getRequester(project);
  return <ResourceRow obj={project}>
    <div className="col-md-3 col-sm-6 col-xs-8">
      <span className="co-resource-link">
        <ResourceIcon kind="Project" />
        <Link to={`/overview/ns/${name}`} title={displayName} className="co-resource-link__resource-name">{project.metadata.name}</Link>
      </span>
    </div>
    <div className="col-md-3 col-sm-3 col-xs-4">
      {project.status.phase}
    </div>
    <div className="col-md-3 col-sm-3 hidden-xs">
      {requester || <span className="text-muted">No requester</span>}
    </div>
    <div className="col-md-3 hidden-sm hidden-xs">
      <LabelList kind="Project" labels={project.metadata.labels} />
    </div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={projectMenuActions} kind="Project" resource={project} />
    </div>
  </ResourceRow>;
};

const ProjectList_ = props => {
  const ProjectEmptyMessageDetail = <React.Fragment>
    <p className="co-pre-line">
      {props.createProjectMessage || 'Create a project for your application.'}
    </p>
    <p>
      To learn more, visit the OpenShift <a href={openshiftHelpBase} target="_blank" rel="noopener noreferrer">documentation</a>.
    </p>
  </React.Fragment>;
  const ProjectEmptyMessage = () => <MsgBox title="Welcome to OpenShift" detail={ProjectEmptyMessageDetail} />;
  return <List {...props} Header={ProjectHeader} Row={ProjectRow} EmptyMsg={ProjectEmptyMessage} />;
};
export const ProjectList = connect(createProjectMessageStateToProps)(ProjectList_);

const ProjectsPage_ = props => {
  const canCreate = props.flags.CAN_CREATE_PROJECT;
  return <ListPage {...props} ListComponent={ProjectList} canCreate={canCreate} createHandler={createProjectModal} />;
};
export const ProjectsPage = connectToFlags(FLAGS.CAN_CREATE_PROJECT)(ProjectsPage_);

class PullSecret extends SafetyFirst {
  constructor(props) {
    super(props);
    this.state = {isLoading: true, data: undefined};
  }

  componentDidMount() {
    super.componentDidMount();
    this.load(_.get(this.props, 'namespace.metadata.name'));
  }

  load(namespaceName) {
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

  render() {
    if (this.state.isLoading) {
      return <LoadingInline />;
    }
    const modal = () => configureNamespacePullSecretModal({namespace: this.props.namespace, pullSecret: this.state.data});
    return <a className="co-m-modal-link" onClick={modal}>{_.get(this.state.data, 'metadata.name') || 'Not Configured'}</a>;
  }
}

export const NamespaceLineCharts = ({ns}) => <div className="row">
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
</div>;

export const TopPodsBarChart = ({ns}) => (
  <Bar
    title="Memory Usage by Pod (Top 10)"
    query={`sort(topk(10, sum by (pod_name)(container_memory_usage_bytes{pod_name!="", namespace="${ns.metadata.name}"})))`}
    humanize={humanizeMem}
    metric="pod_name" />
);

const ResourceUsage = requirePrometheus(({ns}) => <div className="co-m-pane__body">
  <SectionHeading text="Resource Usage" />
  <NamespaceLineCharts ns={ns} />
  <TopPodsBarChart ns={ns} />
</div>);

export const NamespaceSummary = ({ns}) => {
  const displayName = getDisplayName(ns);
  const requester = getRequester(ns);
  return <div className="row">
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
  </div>;
};

const Details = ({obj: ns}) => {
  return <div>
    <div className="co-m-pane__body">
      <SectionHeading text={`${ns.kind} Overview`} />
      <NamespaceSummary ns={ns} />
    </div>
    <ResourceUsage ns={ns} />
  </div>;
};

const RolesPage = ({obj: {metadata}}) => <RoleBindingsPage namespace={metadata.name} showTitle={false} />;

const autocompleteFilter = (text, item) => fuzzy(text, item);

const defaultBookmarks = {};

const namespaceBarDropdownStateToProps = state => {
  const activeNamespace = state.UI.get('activeNamespace');
  const canListNS = state[featureReducerName].get(FLAGS.CAN_LIST_NS);

  return { activeNamespace, canListNS };
};

class NamespaceBarDropdowns_ extends React.Component {

  componentDidUpdate() {
    const { namespace, dispatch } = this.props;
    if (namespace.loaded) {
      const noProjects = _.isEmpty(namespace.data);
      setFlag(dispatch, FLAGS.SHOW_OPENSHIFT_START_GUIDE, noProjects);
    }
  }

  render() {
    const { activeNamespace, dispatch, canListNS, useProjects } = this.props;
    if (flagPending(canListNS)) {
      return null;
    }

    const { loaded, data } = this.props.namespace;
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

    const addActions = [
      {
        label: 'Browse Catalog',
        href: '/catalog',
      },
      {
        label: 'Deploy Image',
        href: `/deploy-image?preselected-ns=${activeNamespace}`,
      },
      {
        label: 'Import YAML',
        href: formatNamespacedRouteForResource('import', activeNamespace),
      },
    ];

    return <div className="co-namespace-bar__dropdowns">
      <Dropdown
        className="co-namespace-selector"
        menuClassName="co-namespace-selector__menu"
        buttonClassName="btn-link"
        canFavorite
        items={items}
        titlePrefix={model.label}
        title={<span className="btn-link__title">{title}</span>}
        onChange={onChange}
        selectedKey={activeNamespace || ALL_NAMESPACES_KEY}
        autocompleteFilter={autocompleteFilter}
        autocompletePlaceholder={`Select ${model.label.toLowerCase()}...`}
        defaultBookmarks={defaultBookmarks}
        storageKey={NAMESPACE_LOCAL_STORAGE_KEY}
        shortCut="n" />
      <ActionsMenu
        actions={addActions}
        title={<React.Fragment><span className="fa fa-plus-circle co-add-actions-selector__icon" aria-hidden="true"></span> Add</React.Fragment>}
        menuClassName="co-add-actions-selector__menu dropdown-menu--right"
        buttonClassName="btn-link" />
    </div>;
  }
}

const NamespaceBarDropdowns = connect(namespaceBarDropdownStateToProps)(NamespaceBarDropdowns_);

const NamespaceBar_ = ({useProjects}) => {
  return <div className="co-namespace-bar">
    <Firehose resources={[{kind: getModel(useProjects).kind, prop: 'namespace', isList: true}]}>
      <NamespaceBarDropdowns useProjects={useProjects} />
    </Firehose>
  </div>;
};

const namespaceBarStateToProps = ({k8s}) => {
  const useProjects = k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]);
  return {
    useProjects,
  };
};

export const NamespaceBar = connect(namespaceBarStateToProps)(NamespaceBar_);

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
