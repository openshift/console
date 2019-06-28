import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { connect } from 'react-redux';
import { Tooltip } from './utils/tooltip';
import { Link } from 'react-router-dom';
import * as fuzzy from 'fuzzysearch';

import { NamespaceModel, ProjectModel, SecretModel } from '../models';
import { k8sGet } from '../module/k8s';
import * as UIActions from '../actions/ui';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import { Kebab, Dropdown, Firehose, LabelList, LoadingInline, navFactory, ResourceKebab, SectionHeading, ResourceLink, ResourceSummary, MsgBox, StatusIconAndText, ExternalLink, humanizeCpuCores, humanizeDecimalBytes, useAccessReview } from './utils';
import { createNamespaceModal, createProjectModal, deleteNamespaceModal, configureNamespacePullSecretModal } from './modals';
import { RoleBindingsPage } from './RBAC';
import { Bar, Area, requirePrometheus } from './graphs';
import { OC_DOWNLOAD_LINK, ALL_NAMESPACES_KEY, KEYBOARD_SHORTCUTS, NAMESPACE_LOCAL_STORAGE_KEY, FLAGS } from '../const';
import { featureReducerName, flagPending, connectToFlags } from '../reducers/features';
import { setFlag } from '../actions/features';
import { openshiftHelpBase } from './utils/documentation';
import { createProjectMessageStateToProps } from '../reducers/ui';
import { Overview } from './overview';
import { OverviewNamespaceDashboard } from './overview/namespace-overview';

const getModel = useProjects => useProjects ? ProjectModel : NamespaceModel;
const getDisplayName = obj => _.get(obj, ['metadata', 'annotations', 'openshift.io/display-name']);
const getRequester = obj => _.get(obj, ['metadata', 'annotations', 'openshift.io/requester']);

export const deleteModal = (kind, ns) => {
  let {label, weight, accessReview} = Kebab.factory.Delete(kind, ns);
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
  return {label, weight, callback, accessReview};
};

const nsMenuActions = [Kebab.factory.ModifyLabels, Kebab.factory.ModifyAnnotations, Kebab.factory.Edit, deleteModal];

const namespacesColumnClasses = [
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'col-xs-6'),
  classNames('col-sm-4', 'hidden-xs'),
  Kebab.columnClass,
];

const NamespacesTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: namespacesColumnClasses[0]},
    },
    {
      title: 'Status', sortField: 'status.phase', transforms: [sortable],
      props: { className: namespacesColumnClasses[1]},
    },
    {
      title: 'Labels', sortField: 'metadata.labels', transforms: [sortable],
      props: { className: namespacesColumnClasses[2]},
    },
    { title: '',
      props: { className: namespacesColumnClasses[3]},
    },
  ];
};
NamespacesTableHeader.displayName = 'NamespacesTableHeader';

const NamespacesTableRow = ({obj: ns, index, key, style}) => {
  return (
    <TableRow id={ns.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={namespacesColumnClasses[0]}>
        <ResourceLink kind="Namespace" name={ns.metadata.name} title={ns.metadata.uid} />
      </TableData>
      <TableData className={classNames(namespacesColumnClasses[1], 'co-break-word')}>
        <StatusIconAndText status={ns.status.phase} />
      </TableData>
      <TableData className={namespacesColumnClasses[2]}>
        <LabelList kind="Namespace" labels={ns.metadata.labels} />
      </TableData>
      <TableData className={namespacesColumnClasses[3]}>
        <ResourceKebab actions={nsMenuActions} kind="Namespace" resource={ns} />
      </TableData>
    </TableRow>
  );
};
NamespacesTableRow.displayName = 'NamespacesTableRow';

export const NamespacesList = props => <Table {...props} aria-label="Namespaces" Header={NamespacesTableHeader} Row={NamespacesTableRow} virtualize />;

export const NamespacesPage = props => <ListPage {...props} ListComponent={NamespacesList} canCreate={true} createHandler={() => createNamespaceModal({blocking: true})} />;

const projectMenuActions = [Kebab.factory.Edit, deleteModal];

const projectColumnClasses = [
  classNames('col-md-3', 'col-sm-6', 'col-xs-8'),
  classNames('col-md-3', 'col-sm-3', 'col-xs-4'),
  classNames('col-md-3', 'col-sm-3', 'hidden-xs'),
  classNames('col-md-3', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const ProjectTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: projectColumnClasses[0]},
    },
    {
      title: 'Status', sortField: 'status.phase', transforms: [sortable],
      props: { className: projectColumnClasses[1]},
    },
    {
      title: 'Requester', sortField: 'metadata.annotations.[\'openshift.io/requester\']', transforms: [sortable],
      props: { className: projectColumnClasses[2]},
    },
    {
      title: 'Labels', sortField: 'metadata.labels', transforms: [sortable],
      props: { className: projectColumnClasses[3]},
    },
    { title: '',
      props: { className: projectColumnClasses[4]},
    },
  ];
};
ProjectTableHeader.displayName = 'ProjectTableHeader';

const ProjectTableRow = ({obj: project, index, key, style}) => {
  const requester = getRequester(project);
  return (
    <TableRow id={project.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={projectColumnClasses[0]}>
        <span className="co-resource-item">
          <ResourceLink kind="Project" name={project.metadata.name} title={project.metadata.uid} />
        </span>
      </TableData>
      <TableData className={projectColumnClasses[1]}>
        <StatusIconAndText status={project.status.phase} />
      </TableData>
      <TableData className={classNames(projectColumnClasses[2], 'co-break-word')}>
        {requester || <span className="text-muted">No requester</span>}
      </TableData>
      <TableData className={projectColumnClasses[3]}>
        <LabelList kind="Project" labels={project.metadata.labels} />
      </TableData>
      <TableData className={projectColumnClasses[4]}>
        <ResourceKebab actions={projectMenuActions} kind="Project" resource={project} />
      </TableData>
    </TableRow>
  );
};
ProjectTableRow.displayName = 'ProjectTableRow';

const ProjectList_ = props => {
  const ProjectEmptyMessageDetail = <React.Fragment>
    <p className="co-pre-line">
      {props.createProjectMessage || 'Create a project for your application.'}
    </p>
    <p>
      To learn more, visit the OpenShift <ExternalLink href={openshiftHelpBase} text="documentation" />.
    </p>
    <p>
      Download the <ExternalLink href={OC_DOWNLOAD_LINK} text="command-line tools" />.
    </p>
  </React.Fragment>;
  const ProjectEmptyMessage = () => <MsgBox title="Welcome to OpenShift" detail={ProjectEmptyMessageDetail} />;
  return <Table {...props} aria-label="Projects" Header={ProjectTableHeader} Row={ProjectTableRow} EmptyMsg={ProjectEmptyMessage} virtualize />;
};
export const ProjectList = connect(createProjectMessageStateToProps)(ProjectList_);

const ProjectsPage_ = props => {
  const canCreate = props.flags[FLAGS.CAN_CREATE_PROJECT];
  // Skip self-subject access review for projects since they use a special project request API.
  // `FLAGS.CAN_CREATE_PROJECT` determines if the user can create projects.
  return <ListPage {...props} ListComponent={ProjectList} canCreate={canCreate} skipAccessReview createHandler={() => createProjectModal({ blocking: true })} />;
};
export const ProjectsPage = connectToFlags(FLAGS.CAN_CREATE_PROJECT)(ProjectsPage_);

/** @type {React.SFC<{namespace: K8sResourceKind}>} */
export const PullSecret = (props) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState(undefined);

  React.useEffect(() => {
    k8sGet(SecretModel, null, props.namespace.metadata.name, {queryParams: {fieldSelector: 'type=kubernetes.io/dockerconfigjson'}})
      .then((pullSecrets) => {
        setIsLoading(false);
        setData(_.get(pullSecrets, 'items[0]'));
      })
      .catch((error) => {
        setIsLoading(false);
        setData(undefined);
        // A 404 just means that no pull secrets exist
        if (error.status !== 404) {
          throw error;
        }
      });
  }, [props.namespace.metadata.name]);

  if (isLoading) {
    return <LoadingInline />;
  }
  const modal = () => configureNamespacePullSecretModal({namespace: props.namespace, pullSecret: data});

  return <button type="button" className="btn btn-link co-modal-btn-link co-modal-btn-link--left" onClick={modal}>{_.get(data, 'metadata.name') || 'Not Configured'}</button>;
};

export const NamespaceLineCharts = ({ns}) => <div className="row">
  <div className="col-md-6 col-sm-12">
    <Area
      title="CPU Usage"
      formatY={humanizeCpuCores}
      namespace={ns.metadata.name}
      query={`namespace:container_cpu_usage:sum{namespace='${ns.metadata.name}'}`}
    />
  </div>
  <div className="col-md-6 col-sm-12">
    <Area
      title="Memory Usage"
      formatY={humanizeDecimalBytes}
      namespace={ns.metadata.name}
      query={`namespace:container_memory_usage_bytes:sum{namespace='${ns.metadata.name}'}`}
    />
  </div>
</div>;

export const TopPodsBarChart = ({ns}) => (
  <Bar
    title="Memory Usage by Pod (Top 10)"
    namespace={ns.metadata.name}
    query={`sort(topk(10, sum by (pod_name)(container_memory_usage_bytes{container_name!="POD",container_name!="",pod_name!="", namespace="${ns.metadata.name}"})))`}
    formatY={humanizeDecimalBytes}
    metric="pod_name"
  />
);

const ResourceUsage = requirePrometheus(({ns}) => <div className="co-m-pane__body">
  <SectionHeading text="Resource Usage" />
  <NamespaceLineCharts ns={ns} />
  <TopPodsBarChart ns={ns} />
</div>);

export const NamespaceSummary = ({ns}) => {
  const displayName = getDisplayName(ns);
  const requester = getRequester(ns);
  const canListSecrets = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    verb: 'patch',
    namespace: ns.metadata.name,
  });
  return <div className="row">
    <div className="col-sm-6 col-xs-12">
      <ResourceSummary resource={ns}>
        {displayName && <dt>Display Name</dt>}
        {displayName && <dd>{displayName}</dd>}
        {requester && <dt>Requester</dt>}
        {requester && <dd>{requester}</dd>}
      </ResourceSummary>
    </div>
    <div className="col-sm-6 col-xs-12">
      <dl className="co-m-pane__details">
        <dt>Status</dt>
        <dd><StatusIconAndText status={ns.status.phase} /></dd>
        {canListSecrets && <React.Fragment>
          <dt>Default Pull Secret</dt>
          <dd><PullSecret namespace={ns} /></dd>
        </React.Fragment>}
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
const namespaceBarDropdownDispatchToProps = (dispatch) => ({
  showStartGuide: (show) => dispatch(setFlag(FLAGS.SHOW_OPENSHIFT_START_GUIDE, show)),
});

class NamespaceBarDropdowns_ extends React.Component {
  componentDidUpdate() {
    const { namespace, showStartGuide } = this.props;
    if (namespace.loaded) {
      const noProjects = _.isEmpty(namespace.data);
      showStartGuide(noProjects);
    }
  }

  render() {
    const { activeNamespace, dispatch, canListNS, useProjects, children } = this.props;
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

    return <div className="co-namespace-bar__items">
      <Dropdown
        className="co-namespace-selector"
        menuClassName="co-namespace-selector__menu"
        buttonClassName="pf-m-plain"
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
        shortCut={KEYBOARD_SHORTCUTS.focusNamespaceDropdown} />
      { children }
      <Link to={UIActions.formatNamespacedRouteForResource('import', activeNamespace)} className="co-namespace-bar__import"><span className="fa fa-plus-circle co-add-actions-selector__icon" aria-hidden="true"></span>Import YAML</Link>
    </div>;
  }
}

const NamespaceBarDropdowns = connect(namespaceBarDropdownStateToProps, namespaceBarDropdownDispatchToProps)(NamespaceBarDropdowns_);

const NamespaceBar_ = ({useProjects, children}) => {
  return <div className="co-namespace-bar">
    <Firehose resources={[{kind: getModel(useProjects).kind, prop: 'namespace', isList: true}]}>
      <NamespaceBarDropdowns useProjects={useProjects}>
        {children}
      </NamespaceBarDropdowns>
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
  pages={[navFactory.details(OverviewNamespaceDashboard), navFactory.editYaml(), navFactory.workloads(Overview), navFactory.roles(RolesPage)]}
/>;
