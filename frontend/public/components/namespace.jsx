import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { connect } from 'react-redux';
import { Tooltip, Button } from '@patternfly/react-core';

import { PencilAltIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import * as fuzzy from 'fuzzysearch';
import {
  Status,
  getRequester,
  ALL_NAMESPACES_KEY,
  KEYBOARD_SHORTCUTS,
  NAMESPACE_LOCAL_STORAGE_KEY,
  FLAGS,
} from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';

import { NamespaceModel, ProjectModel, SecretModel } from '../models';
import { coFetchJSON } from '../co-fetch';
import { k8sGet, referenceForModel } from '../module/k8s';
import * as k8sActions from '../actions/k8s';
import * as UIActions from '../actions/ui';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  DetailsItem,
  Dropdown,
  ExternalLink,
  Firehose,
  Kebab,
  LabelList,
  LoadingInline,
  MsgBox,
  ResourceIcon,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  SectionHeading,
  Timestamp,
  formatBytesAsMiB,
  formatCores,
  humanizeBinaryBytes,
  humanizeCpuCores,
  navFactory,
  useAccessReview,
} from './utils';
import {
  createNamespaceModal,
  createProjectModal,
  deleteNamespaceModal,
  configureNamespacePullSecretModal,
} from './modals';
import { RoleBindingsPage } from './RBAC';
import { Bar, Area, PROMETHEUS_BASE_PATH, requirePrometheus } from './graphs';
import { featureReducerName, flagPending, connectToFlags } from '../reducers/features';
import { setFlag } from '../actions/features';
import { OpenShiftGettingStarted } from './start-guide';
import { Overview } from './overview';
import {
  getNamespaceDashboardConsoleLinks,
  ProjectDashboard,
} from './dashboard/project-dashboard/project-dashboard';
import { removeQueryArgument } from './utils/router';

const getModel = (useProjects) => (useProjects ? ProjectModel : NamespaceModel);
const getDisplayName = (obj) =>
  _.get(obj, ['metadata', 'annotations', 'openshift.io/display-name']);
const CREATE_NEW_RESOURCE = '#CREATE_RESOURCE_ACTION#';

export const deleteModal = (kind, ns) => {
  let { label, weight, accessReview } = Kebab.factory.Delete(kind, ns);
  let callback = undefined;
  let tooltip;

  if (ns.metadata.name === 'default') {
    tooltip = `${kind.label} default cannot be deleted`;
  } else if (ns.status.phase === 'Terminating') {
    tooltip = `${kind.label} is already terminating`;
  } else {
    callback = () => deleteNamespaceModal({ kind, resource: ns });
  }
  if (tooltip) {
    label = (
      <div className="dropdown__disabled">
        <Tooltip content={tooltip}>
          <span>{label}</span>
        </Tooltip>
      </div>
    );
  }
  return { label, weight, callback, accessReview };
};

const nsMenuActions = [
  Kebab.factory.ModifyLabels,
  Kebab.factory.ModifyAnnotations,
  Kebab.factory.Edit,
  deleteModal,
];

const fetchNamespaceMetrics = () => {
  const metrics = [
    {
      key: 'memory',
      query: 'sum by(namespace) (container_memory_working_set_bytes{container="",pod!=""})',
    },
    {
      key: 'cpu',
      query: 'namespace:container_cpu_usage:sum',
    },
  ];
  const promises = metrics.map(({ key, query }) => {
    const url = `${PROMETHEUS_BASE_PATH}/api/v1/query?&query=${query}`;
    return coFetchJSON(url).then(({ data: { result } }) => {
      return result.reduce((acc, data) => {
        const value = Number(data.value[1]);
        return _.set(acc, [key, data.metric.namespace], value);
      }, {});
    });
  });
  return Promise.all(promises).then((data) => _.assign({}, ...data));
};

const namespacesColumnClasses = [
  '', // name
  '', // status
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'), // labels
  classNames('pf-m-hidden', 'pf-m-visible-on-lg pf-u-w-16-on-lg'), // created
  Kebab.columnClass,
];

const NamespacesTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: namespacesColumnClasses[0] },
    },
    {
      title: 'Status',
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: namespacesColumnClasses[1] },
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: namespacesColumnClasses[2] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: namespacesColumnClasses[3] },
    },
    { title: '', props: { className: namespacesColumnClasses[4] } },
  ];
};
NamespacesTableHeader.displayName = 'NamespacesTableHeader';

const NamespacesTableRow = ({ obj: ns, index, key, style }) => {
  return (
    <TableRow id={ns.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={namespacesColumnClasses[0]}>
        <ResourceLink kind="Namespace" name={ns.metadata.name} title={ns.metadata.uid} />
      </TableData>
      <TableData className={classNames(namespacesColumnClasses[1], 'co-break-word')}>
        <Status status={ns.status.phase} />
      </TableData>
      <TableData className={namespacesColumnClasses[2]}>
        <LabelList kind="Namespace" labels={ns.metadata.labels} />
      </TableData>
      <TableData className={namespacesColumnClasses[3]}>
        <Timestamp timestamp={ns.metadata.creationTimestamp} />
      </TableData>
      <TableData className={namespacesColumnClasses[4]}>
        <ResourceKebab actions={nsMenuActions} kind="Namespace" resource={ns} />
      </TableData>
    </TableRow>
  );
};

export const NamespacesList = (props) => (
  <Table
    {...props}
    aria-label="Namespaces"
    Header={NamespacesTableHeader}
    Row={NamespacesTableRow}
    virtualize
  />
);

export const NamespacesPage = (props) => {
  const createItems = {
    form: 'From FORM',
    yaml: 'From YAML',
  };
  const createProps = {
    items: createItems,
    createLink: (type) =>
      `/k8s/ns/${props.namespace || 'default'}/namespaces/~new/${type !== 'yaml' ? type : ''}`,
  };
  return <ListPage
    {...props}
    ListComponent={NamespacesList}
    canCreate={true}
    createProps={createProps}
  // createHandler={() => createNamespaceModal({ blocking: true })}
  />
};

export const projectMenuActions = [Kebab.factory.Edit, deleteModal];

const projectColumnClasses = [
  '', // name
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'), // display name
  '', // status
  classNames('pf-m-hidden', 'pf-m-visible-on-lg'), // requester
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // memory
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'), // cpu
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), // created
  Kebab.columnClass,
];

const projectTableHeader = ({ showMetrics, showActions }) => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: projectColumnClasses[0] },
    },
    {
      title: 'Display Name',
      sortField: 'metadata.annotations["openshift.io/display-name"]',
      transforms: [sortable],
      props: { className: projectColumnClasses[1] },
    },
    {
      title: 'Status',
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: projectColumnClasses[2] },
    },
    {
      title: 'Requester',
      sortField: "metadata.annotations.['openshift.io/requester']",
      transforms: [sortable],
      props: { className: projectColumnClasses[3] },
    },
    ...(showMetrics
      ? [
        {
          title: 'Memory',
          sortFunc: 'namespaceMemory',
          transforms: [sortable],
          props: { className: projectColumnClasses[4] },
        },
        {
          title: 'CPU',
          sortFunc: 'namespaceCPU',
          transforms: [sortable],
          props: { className: projectColumnClasses[5] },
        },
      ]
      : []),
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: projectColumnClasses[6] },
    },
    ...(showActions ? [{ title: '', props: { className: projectColumnClasses[7] } }] : []),
  ];
};

const ProjectLink = connect(null, {
  setActiveNamespace: UIActions.setActiveNamespace,
  filterList: k8sActions.filterList,
})(({ project, setActiveNamespace, filterList }) => (
  <span className="co-resource-item co-resource-item--truncate">
    <ResourceIcon kind="Project" />
    <Button
      isInline
      title={project.metadata.name}
      type="button"
      className="co-resource-item__resource-name"
      onClick={() => {
        setActiveNamespace(project.metadata.name);
        removeQueryArgument('project-name');
        // clear project-name filter when active namespace is changed
        filterList(referenceForModel(ProjectModel), 'project-name', '');
      }}
      variant="link"
    >
      {project.metadata.name}
    </Button>
  </span>
));
const projectHeaderWithoutActions = () =>
  projectTableHeader({ showMetrics: false, showActions: false });

const projectRowStateToProps = ({ UI }) => ({
  metrics: UI.getIn(['metrics', 'namespace']),
});

const ProjectTableRow = connect(projectRowStateToProps)(
  ({ obj: project, index, rowKey, style, customData = {}, metrics }) => {
    const requester = getRequester(project);
    const { ProjectLinkComponent, actionsEnabled = true, showMetrics } = customData;
    const bytes = _.get(metrics, ['memory', project.metadata.name]);
    const cores = _.get(metrics, ['cpu', project.metadata.name]);
    return (
      <TableRow id={project.metadata.uid} index={index} trKey={rowKey} style={style}>
        <TableData className={projectColumnClasses[0]}>
          {customData && ProjectLinkComponent ? (
            <ProjectLinkComponent project={project} />
          ) : (
              <span className="co-resource-item">
                <ResourceLink
                  kind="Project"
                  name={project.metadata.name}
                  title={project.metadata.uid}
                />
              </span>
            )}
        </TableData>
        <TableData className={projectColumnClasses[1]}>
          <span className="co-break-word co-line-clamp">
            {getDisplayName(project) || <span className="text-muted">No display name</span>}
          </span>
        </TableData>
        <TableData className={projectColumnClasses[2]}>
          <Status status={project.status.phase} />
        </TableData>
        <TableData className={classNames(projectColumnClasses[3], 'co-break-word')}>
          {requester || <span className="text-muted">No requester</span>}
        </TableData>
        {showMetrics && (
          <>
            <TableData className={projectColumnClasses[4]}>
              {bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-'}
            </TableData>
            <TableData className={projectColumnClasses[5]}>
              {cores ? `${formatCores(cores)} cores` : '-'}
            </TableData>
          </>
        )}
        <TableData className={projectColumnClasses[6]}>
          <Timestamp timestamp={project.metadata.creationTimestamp} />
        </TableData>
        {actionsEnabled && (
          <TableData className={projectColumnClasses[7]}>
            <ResourceKebab actions={projectMenuActions} kind="Project" resource={project} />
          </TableData>
        )}
      </TableRow>
    );
  },
);
ProjectTableRow.displayName = 'ProjectTableRow';

const Row = (rowArgs) => (
  <ProjectTableRow
    obj={rowArgs.obj}
    index={rowArgs.index}
    rowKey={rowArgs.key}
    style={rowArgs.style}
    customData={rowArgs.customData}
  />
);

export const ProjectsTable = (props) => (
  <Table
    {...props}
    aria-label="Projects"
    Header={projectHeaderWithoutActions}
    Row={Row}
    customData={{ ProjectLinkComponent: ProjectLink, actionsEnabled: false }}
    virtualize
  />
);

const headerWithMetrics = () => projectTableHeader({ showMetrics: true, showActions: true });
const headerNoMetrics = () => projectTableHeader({ showMetrics: false, showActions: true });
const ProjectList_ = connectToFlags(
  FLAGS.CAN_CREATE_PROJECT,
  FLAGS.CAN_GET_NS,
)(({ data, flags, setNamespaceMetrics, ...tableProps }) => {
  const canGetNS = flags[FLAGS.CAN_GET_NS];
  const showMetrics = PROMETHEUS_BASE_PATH && canGetNS && window.screen.width >= 1200;
  /* eslint-disable react-hooks/exhaustive-deps */
  React.useEffect(() => {
    if (showMetrics) {
      const updateMetrics = () => fetchNamespaceMetrics().then(setNamespaceMetrics);
      updateMetrics();
      const id = setInterval(updateMetrics, 30 * 1000);
      return () => clearInterval(id);
    }
  }, [showMetrics]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Don't render the table until we know whether we can get metrics. It's
  // not possible to change the table headers once the component is mounted.
  if (flagPending(canGetNS)) {
    return null;
  }

  const ProjectEmptyMessage = () => (
    <MsgBox
      title="Welcome to OpenShift"
      detail={<OpenShiftGettingStarted canCreateProject={flags[FLAGS.CAN_CREATE_PROJECT]} />}
    />
  );
  const ProjectNotFoundMessage = () => <MsgBox title="No Projects Found" />;
  return (
    <Table
      {...tableProps}
      aria-label="Projects"
      data={data}
      Header={showMetrics ? headerWithMetrics : headerNoMetrics}
      Row={Row}
      EmptyMsg={data.length > 0 ? ProjectNotFoundMessage : ProjectEmptyMessage}
      customData={{ showMetrics }}
      virtualize
    />
  );
});
export const ProjectList = connect(null, (dispatch) => ({
  setNamespaceMetrics: (metrics) => dispatch(UIActions.setNamespaceMetrics(metrics)),
}))(connectToFlags(FLAGS.CAN_CREATE_PROJET, FLAGS.CAN_GET_NS)(ProjectList_));

export const ProjectsPage = connectToFlags(FLAGS.CAN_CREATE_PROJECT)(({ flags, ...rest }) => (
  // Skip self-subject access review for projects since they use a special project request API.
  // `FLAGS.CAN_CREATE_PROJECT` determines if the user can create projects.
  <ListPage
    {...rest}
    ListComponent={ProjectList}
    canCreate={flags[FLAGS.CAN_CREATE_PROJECT]}
    createHandler={() => createProjectModal({ blocking: true })}
    filterLabel="by name or display name"
    skipAccessReview
    textFilter="project-name"
  />
));

/** @type {React.SFC<{namespace: K8sResourceKind}>} */
export const PullSecret = (props) => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [data, setData] = React.useState(undefined);

  React.useEffect(() => {
    k8sGet(SecretModel, null, props.namespace.metadata.name, {
      queryParams: { fieldSelector: 'type=kubernetes.io/dockerconfigjson' },
    })
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
  const modal = () =>
    configureNamespacePullSecretModal({ namespace: props.namespace, pullSecret: data });

  return (
    <Button variant="link" type="button" isInline onClick={modal}>
      {_.get(data, 'metadata.name') || 'Not Configured'}
      <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />
    </Button>
  );
};

export const NamespaceLineCharts = ({ ns }) => (
  <div className="row">
    <div className="col-md-6 col-sm-12">
      <Area
        title="CPU Usage"
        humanize={humanizeCpuCores}
        namespace={ns.metadata.name}
        query={`namespace:container_cpu_usage:sum{namespace='${ns.metadata.name}'}`}
      />
    </div>
    <div className="col-md-6 col-sm-12">
      <Area
        title="Memory Usage"
        humanize={humanizeBinaryBytes}
        byteDataType={ByteDataTypes.BinaryBytes}
        namespace={ns.metadata.name}
        query={`sum by(namespace) (container_memory_working_set_bytes{namespace="${ns.metadata.name}",container="",pod!=""})`}
      />
    </div>
  </div>
);

export const TopPodsBarChart = ({ ns }) => (
  <Bar
    title="Memory Usage by Pod (Top 10)"
    namespace={ns.metadata.name}
    query={`sort_desc(topk(10, sum by (pod)(container_memory_working_set_bytes{container="",pod!="",namespace="${ns.metadata.name}"})))`}
    humanize={humanizeBinaryBytes}
    metric="pod"
  />
);

const ResourceUsage = requirePrometheus(({ ns }) => (
  <div className="co-m-pane__body">
    <SectionHeading text="Resource Usage" />
    <NamespaceLineCharts ns={ns} />
    <TopPodsBarChart ns={ns} />
  </div>
));

export const NamespaceSummary = ({ ns }) => {
  const displayName = getDisplayName(ns);
  const requester = getRequester(ns);
  const canListSecrets = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    verb: 'patch',
    namespace: ns.metadata.name,
  });
  return (
    <div className="row">
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
          <DetailsItem label="Status" obj={ns} path="status.phase">
            <Status status={ns.status.phase} />
          </DetailsItem>
          {canListSecrets && (
            <>
              <dt>Default Pull Secret</dt>
              <dd>
                <PullSecret namespace={ns} />
              </dd>
            </>
          )}
          <dt>Network Policies</dt>
          <dd>
            <Link to={`/k8s/ns/${ns.metadata.name}/networkpolicies`}>Network Policies</Link>
          </dd>
        </dl>
      </div>
    </div>
  );
};

const NamespaceDetails_ = ({ obj: ns, consoleLinks, customData }) => {
  const links = getNamespaceDashboardConsoleLinks(ns, consoleLinks);
  return (
    <div>
      <div className="co-m-pane__body">
        {!customData?.hideHeading && <SectionHeading text={`${ns.kind} Details`} />}
        <NamespaceSummary ns={ns} />
      </div>
      {ns.kind === 'Namespace' && <ResourceUsage ns={ns} />}
      {!_.isEmpty(links) && (
        <div className="co-m-pane__body">
          <SectionHeading text="Launcher" />
          <ul className="list-unstyled">
            {_.map(_.sortBy(links, 'spec.text'), (link) => {
              return (
                <li key={link.metadata.uid}>
                  <ExternalLink href={link.spec.href} text={link.spec.text} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

const DetailsStateToProps = ({ UI }) => ({
  consoleLinks: UI.get('consoleLinks'),
});

export const NamespaceDetails = connect(DetailsStateToProps)(NamespaceDetails_);

const RolesPage = ({ obj: { metadata } }) => (
  <RoleBindingsPage
    createPath={`/k8s/ns/${metadata.name}/rolebindings/~new?rolekind=Role`}
    namespace={metadata.name}
    showTitle={false}
  />
);

const autocompleteFilter = (text, item) => fuzzy(text, item);

const defaultBookmarks = {};

const namespaceBarDropdownStateToProps = (state) => {
  const activeNamespace = state.UI.get('activeNamespace');
  const canListNS = state[featureReducerName].get(FLAGS.CAN_LIST_NS);
  const canCreateProject = state[featureReducerName].get(FLAGS.CAN_CREATE_PROJECT);

  return { activeNamespace, canListNS, canCreateProject };
};
const namespaceBarDropdownDispatchToProps = (dispatch) => ({
  setActiveNamespace: (ns) => dispatch(UIActions.setActiveNamespace(ns)),
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
    const {
      activeNamespace,
      onNamespaceChange,
      setActiveNamespace,
      canListNS,
      canCreateProject,
      useProjects,
      children,
      disabled,
    } = this.props;
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

    _.map(data, 'metadata.name')
      .sort()
      .forEach((name) => (items[name] = name));

    let title = activeNamespace;
    if (activeNamespace === ALL_NAMESPACES_KEY) {
      title = allNamespacesTitle;
    } else if (loaded && !_.has(items, title)) {
      // If the currently active namespace is not found in the list of all namespaces, put it in anyway
      items[title] = title;
    }
    const defaultActionItem = canCreateProject
      ? [
        {
          actionTitle: `Create ${model.label}`,
          actionKey: CREATE_NEW_RESOURCE,
        },
      ]
      : [];

    const onChange = (newNamespace) => {
      if (newNamespace === CREATE_NEW_RESOURCE) {
        createProjectModal({
          blocking: true,
          onSubmit: (newProject) => {
            setActiveNamespace(newProject.metadata.name);
            removeQueryArgument('project-name');
          },
        });
      } else {
        onNamespaceChange && onNamespaceChange(newNamespace);
        setActiveNamespace(newNamespace);
        removeQueryArgument('project-name');
      }
    };

    return (
      <div className="co-namespace-bar__items" data-test-id="namespace-bar-dropdown">
        <Dropdown
          disabled={disabled}
          className="co-namespace-selector"
          menuClassName="co-namespace-selector__menu"
          buttonClassName="pf-m-plain"
          canFavorite
          items={items}
          actionItems={defaultActionItem}
          titlePrefix={model.label}
          title={title}
          onChange={onChange}
          selectedKey={activeNamespace || ALL_NAMESPACES_KEY}
          autocompleteFilter={autocompleteFilter}
          autocompletePlaceholder={`Select ${model.label.toLowerCase()}...`}
          defaultBookmarks={defaultBookmarks}
          storageKey={NAMESPACE_LOCAL_STORAGE_KEY}
          shortCut={KEYBOARD_SHORTCUTS.focusNamespaceDropdown}
        />
        {children}
      </div>
    );
  }
}

const NamespaceBarDropdowns = connect(
  namespaceBarDropdownStateToProps,
  namespaceBarDropdownDispatchToProps,
)(NamespaceBarDropdowns_);

const NamespaceBar_ = ({ useProjects, children, disabled, onNamespaceChange }) => {
  return (
    <div className="co-namespace-bar">
      <Firehose resources={[{ kind: getModel(useProjects).kind, prop: 'namespace', isList: true }]}>
        <NamespaceBarDropdowns
          useProjects={useProjects}
          disabled={disabled}
          onNamespaceChange={onNamespaceChange}
        >
          {children}
        </NamespaceBarDropdowns>
      </Firehose>
    </div>
  );
};

const namespaceBarStateToProps = ({ k8s }) => {
  const useProjects = k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]);
  return {
    useProjects,
  };
};
/** @type {React.FC<{children?: ReactNode, disabled?: boolean, onNamespaceChange?: Function}>} */
export const NamespaceBar = connect(namespaceBarStateToProps)(NamespaceBar_);

export const NamespacesDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={nsMenuActions}
    pages={[
      navFactory.details(NamespaceDetails),
      navFactory.editYaml(),
      navFactory.roles(RolesPage),
    ]}
  />
);

export const ProjectsDetailsPage = (props) => (
  <DetailsPage
    {...props}
    menuActions={projectMenuActions}
    pages={[
      {
        href: '',
        name: 'Overview',
        component: ProjectDashboard,
      },
      {
        href: 'details',
        name: 'Details',
        component: NamespaceDetails,
      },
      navFactory.editYaml(),
      navFactory.workloads(Overview),
      navFactory.roles(RolesPage),
    ]}
  />
);
