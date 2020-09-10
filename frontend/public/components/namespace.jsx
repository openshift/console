import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { connect, useSelector } from 'react-redux';
import { Tooltip, Button } from '@patternfly/react-core';

import { PencilAltIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import * as fuzzy from 'fuzzysearch';
import {
  Status,
  getRequester,
  getDescription,
  ALL_NAMESPACES_KEY,
  KEYBOARD_SHORTCUTS,
  NAMESPACE_LOCAL_STORAGE_KEY,
  FLAGS,
  GreenCheckCircleIcon,
  getName,
} from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';

import { ConsoleLinkModel, NamespaceModel, ProjectModel, SecretModel } from '../models';
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
import { OverviewListPage } from './overview';
import {
  getNamespaceDashboardConsoleLinks,
  ProjectDashboard,
} from './dashboard/project-dashboard/project-dashboard';
import { removeQueryArgument } from './utils/router';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

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

const namespaceColumnInfo = Object.freeze({
  name: {
    classes: '',
    id: 'name',
    title: 'Name',
  },
  displayName: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
    id: 'displayName',
    title: 'Display Name',
  },
  status: {
    classes: '',
    id: 'status',
    title: 'Status',
  },
  requester: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-lg'),
    id: 'requester',
    title: 'Requester',
  },
  memory: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'memory',
    title: 'Memory',
  },
  cpu: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'cpu',
    title: 'CPU',
  },
  created: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'),
    id: 'created',
    title: 'Created',
  },
  description: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'description',
    title: 'Description',
  },
  labels: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'labels',
    title: 'Labels',
  },
});

const NamespacesTableHeader = () => {
  return [
    {
      title: namespaceColumnInfo.name.title,
      id: namespaceColumnInfo.name.id,
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.name.classes },
    },
    {
      title: namespaceColumnInfo.displayName.title,
      id: namespaceColumnInfo.displayName.id,
      sortField: 'metadata.annotations["openshift.io/display-name"]',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.displayName.classes },
    },
    {
      title: namespaceColumnInfo.status.title,
      id: namespaceColumnInfo.status.id,
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.status.classes },
    },
    {
      title: namespaceColumnInfo.requester.title,
      id: namespaceColumnInfo.requester.id,
      sortField: "metadata.annotations.['openshift.io/requester']",
      transforms: [sortable],
      props: { className: namespaceColumnInfo.requester.classes },
    },
    {
      title: namespaceColumnInfo.memory.title,
      id: namespaceColumnInfo.memory.id,
      sortFunc: 'namespaceMemory',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.memory.classes },
    },
    {
      title: namespaceColumnInfo.cpu.title,
      id: namespaceColumnInfo.cpu.id,
      sortFunc: 'namespaceCPU',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.cpu.classes },
    },
    {
      title: namespaceColumnInfo.created.title,
      id: namespaceColumnInfo.created.id,
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.created.classes },
    },
    {
      title: namespaceColumnInfo.description.title,
      id: namespaceColumnInfo.description.id,
      sortField: "metadata.annotations.['openshift.io/description']",
      transforms: [sortable],
      props: { className: namespaceColumnInfo.description.classes },
      additional: true,
    },
    {
      title: namespaceColumnInfo.labels.title,
      id: namespaceColumnInfo.labels.id,
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.labels.classes },
      additional: true,
    },
    { title: '', props: { className: Kebab.columnClass } },
  ];
};
NamespacesTableHeader.displayName = 'NamespacesTableHeader';

const NamespacesColumnManagementID = referenceForModel(NamespaceModel);

const getNamespacesSelectedColumns = () => {
  return new Set(
    NamespacesTableHeader().reduce((acc, column) => {
      if (column.id && !column.additional) {
        acc.push(column.id);
      }
      return acc;
    }, []),
  );
};

const namespacesRowStateToProps = ({ UI }) => ({
  metrics: UI.getIn(['metrics', 'namespace']),
  selectedColumns: UI.getIn(['columnManagement']),
});

const NamespacesTableRow = connect(namespacesRowStateToProps)(
  ({ obj: ns, index, key, style, metrics, selectedColumns }) => {
    const name = getName(ns);
    const requester = getRequester(ns);
    const bytes = metrics?.memory?.[name];
    const cores = metrics?.cpu?.[name];
    const description = getDescription(ns);
    const labels = ns.metadata.labels;
    const columns = new Set(
      selectedColumns?.get(NamespacesColumnManagementID) || getNamespacesSelectedColumns(),
    );
    return (
      <TableRow id={ns.metadata.uid} index={index} trKey={key} style={style}>
        <TableData className={namespaceColumnInfo.name.classes}>
          <ResourceLink kind="Namespace" name={ns.metadata.name} title={ns.metadata.uid} />
        </TableData>
        <TableData
          className={namespaceColumnInfo.displayName.classes}
          columns={columns}
          columnID={namespaceColumnInfo.displayName.id}
        >
          <span className="co-break-word co-line-clamp">
            {getDisplayName(ns) || <span className="text-muted">No display name</span>}
          </span>
        </TableData>
        <TableData
          className={classNames(namespaceColumnInfo.status.classes, 'co-break-word')}
          columns={columns}
          columnID={namespaceColumnInfo.status.id}
        >
          <Status status={ns.status.phase} />
        </TableData>
        <TableData
          className={classNames(namespaceColumnInfo.requester.classes, 'co-break-word')}
          columns={columns}
          columnID={namespaceColumnInfo.requester.id}
        >
          {requester || <span className="text-muted">No requester</span>}
        </TableData>
        <TableData
          className={namespaceColumnInfo.memory.classes}
          columns={columns}
          columnID={namespaceColumnInfo.memory.id}
        >
          {bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-'}
        </TableData>
        <TableData
          className={namespaceColumnInfo.cpu.classes}
          columns={columns}
          columnID={namespaceColumnInfo.cpu.id}
        >
          {cores ? `${formatCores(cores)} cores` : '-'}
        </TableData>
        <TableData
          className={namespaceColumnInfo.created.classes}
          columns={columns}
          columnID={namespaceColumnInfo.created.id}
        >
          <Timestamp timestamp={ns.metadata.creationTimestamp} />
        </TableData>
        <TableData
          className={namespaceColumnInfo.description.classes}
          columns={columns}
          columnID={namespaceColumnInfo.description.id}
        >
          <span className="co-break-word co-line-clamp">
            {description || <span className="text-muted">No description</span>}
          </span>
        </TableData>
        <TableData
          className={namespaceColumnInfo.labels.classes}
          columns={columns}
          columnID={namespaceColumnInfo.labels.id}
        >
          <LabelList kind="Namespace" labels={labels} />
        </TableData>
        <TableData className={Kebab.columnClass}>
          <ResourceKebab actions={nsMenuActions} kind="Namespace" resource={ns} />
        </TableData>
      </TableRow>
    );
  },
);

const NamespacesRow = (rowArgs) => (
  <NamespacesTableRow
    obj={rowArgs.obj}
    index={rowArgs.index}
    rowKey={rowArgs.key}
    style={rowArgs.style}
  />
);

const mapDispatchToProps = (dispatch) => ({
  setNamespaceMetrics: (metrics) => dispatch(UIActions.setNamespaceMetrics(metrics)),
});

export const NamespacesList = connect(
  null,
  mapDispatchToProps,
)((props) => {
  const { setNamespaceMetrics } = props;
  React.useEffect(() => {
    const updateMetrics = () => fetchNamespaceMetrics().then(setNamespaceMetrics);
    updateMetrics();
    const id = setInterval(updateMetrics, 30 * 1000);
    return () => clearInterval(id);
  }, [setNamespaceMetrics]);
  return (
    <Table
      {...props}
      columnManagementID={NamespacesColumnManagementID}
      aria-label="Namespaces"
      Header={NamespacesTableHeader}
      Row={NamespacesRow}
      virtualize
    />
  );
});

export const NamespacesPage = (props) => {
  let selectedColumns = new Set(
    useSelector(({ UI }) => UI.getIn(['columnManagement', NamespacesColumnManagementID])),
  );
  if (_.isEmpty(selectedColumns)) {
    selectedColumns = getNamespacesSelectedColumns();
  }
  return (
    <ListPage
      {...props}
      ListComponent={NamespacesList}
      canCreate={true}
      createHandler={() => createNamespaceModal({ blocking: true })}
      columnLayout={{
        columns: NamespacesTableHeader().map((column) =>
          _.pick(column, ['title', 'additional', 'id']),
        ),
        id: NamespacesColumnManagementID,
        selectedColumns,
        type: 'Namespaces',
      }}
    />
  );
};

export const projectMenuActions = [Kebab.factory.Edit, deleteModal];

const projectColumnManagementID = referenceForModel(ProjectModel);

const projectTableHeader = ({ showMetrics, showActions }) => {
  return [
    {
      title: namespaceColumnInfo.name.title,
      id: namespaceColumnInfo.name.id,
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.name.classes },
    },
    {
      title: namespaceColumnInfo.displayName.title,
      id: namespaceColumnInfo.displayName.id,
      sortField: 'metadata.annotations["openshift.io/display-name"]',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.displayName.classes },
    },
    {
      title: namespaceColumnInfo.status.title,
      id: namespaceColumnInfo.status.id,
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.status.classes },
    },
    {
      title: namespaceColumnInfo.requester.title,
      id: namespaceColumnInfo.requester.id,
      sortField: "metadata.annotations.['openshift.io/requester']",
      transforms: [sortable],
      props: { className: namespaceColumnInfo.requester.classes },
    },
    ...(showMetrics
      ? [
          {
            title: namespaceColumnInfo.memory.title,
            id: namespaceColumnInfo.memory.id,
            sortFunc: 'namespaceMemory',
            transforms: [sortable],
            props: { className: namespaceColumnInfo.memory.classes },
          },
          {
            title: namespaceColumnInfo.cpu.title,
            id: namespaceColumnInfo.cpu.id,
            sortFunc: 'namespaceCPU',
            transforms: [sortable],
            props: { className: namespaceColumnInfo.cpu.classes },
          },
        ]
      : []),
    {
      title: namespaceColumnInfo.created.title,
      id: namespaceColumnInfo.created.id,
      sortField: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.created.classes },
    },
    {
      title: namespaceColumnInfo.description.title,
      id: namespaceColumnInfo.description.id,
      sortField: "metadata.annotations.['openshift.io/description']",
      transforms: [sortable],
      props: { className: namespaceColumnInfo.description.classes },
      additional: true,
    },
    {
      title: namespaceColumnInfo.labels.title,
      id: namespaceColumnInfo.labels.id,
      sortField: 'metadata.labels',
      transforms: [sortable],
      props: { className: namespaceColumnInfo.labels.classes },
      additional: true,
    },
    ...(showActions ? [{ title: '', props: { className: Kebab.columnClass } }] : []),
  ];
};

const getProjectSelectedColumns = ({ showMetrics, showActions }) => {
  return new Set(
    projectTableHeader({ showMetrics, showActions }).reduce((acc, column) => {
      if (column.id && !column.additional) {
        acc.push(column.id);
      }
      return acc;
    }, []),
  );
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
  selectedColumns: UI.getIn(['columnManagement']),
});

const ProjectTableRow = connect(projectRowStateToProps)(
  ({ obj: project, index, rowKey, style, customData = {}, metrics, selectedColumns }) => {
    const name = getName(project);
    const requester = getRequester(project);
    const { ProjectLinkComponent, actionsEnabled = true, showMetrics, showActions } = customData;
    const bytes = metrics?.memory?.[name];
    const cores = metrics?.cpu?.[name];
    const description = getDescription(project);
    const labels = project.metadata.labels;
    const columns = new Set(
      selectedColumns?.get(projectColumnManagementID) ||
        getProjectSelectedColumns({ showMetrics, showActions }),
    );
    return (
      <TableRow id={project.metadata.uid} index={index} trKey={rowKey} style={style}>
        <TableData className={namespaceColumnInfo.name.classes}>
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
        <TableData
          className={namespaceColumnInfo.displayName.classes}
          columns={columns}
          columnID={namespaceColumnInfo.displayName.id}
        >
          <span className="co-break-word co-line-clamp">
            {getDisplayName(project) || <span className="text-muted">No display name</span>}
          </span>
        </TableData>
        <TableData
          className={namespaceColumnInfo.status.classes}
          columns={columns}
          columnID={namespaceColumnInfo.status.id}
        >
          <Status status={project.status.phase} />
        </TableData>
        <TableData
          className={classNames(namespaceColumnInfo.requester.classes, 'co-break-word')}
          columns={columns}
          columnID={namespaceColumnInfo.requester.id}
        >
          {requester || <span className="text-muted">No requester</span>}
        </TableData>
        {showMetrics && (
          <>
            <TableData
              className={namespaceColumnInfo.memory.classes}
              columns={columns}
              columnID={namespaceColumnInfo.memory.id}
            >
              {bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-'}
            </TableData>
            <TableData
              className={namespaceColumnInfo.cpu.classes}
              columns={columns}
              columnID={namespaceColumnInfo.cpu.id}
            >
              {cores ? `${formatCores(cores)} cores` : '-'}
            </TableData>
          </>
        )}
        <TableData
          className={namespaceColumnInfo.created.classes}
          columns={columns}
          columnID={namespaceColumnInfo.created.id}
        >
          <Timestamp timestamp={project.metadata.creationTimestamp} />
        </TableData>
        <TableData
          className={namespaceColumnInfo.description.classes}
          columns={columns}
          columnID={namespaceColumnInfo.description.id}
        >
          <span className="co-break-word co-line-clamp">
            {description || <span className="text-muted">No description</span>}
          </span>
        </TableData>
        <TableData
          className={namespaceColumnInfo.labels.classes}
          columns={columns}
          columnID={namespaceColumnInfo.labels.id}
        >
          <LabelList labels={labels} kind="Project" />
        </TableData>
        {actionsEnabled && (
          <TableData className={Kebab.columnClass}>
            <ResourceKebab actions={projectMenuActions} kind="Project" resource={project} />
          </TableData>
        )}
      </TableRow>
    );
  },
);
ProjectTableRow.displayName = 'ProjectTableRow';

const ProjectRow = (rowArgs) => (
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
    Row={ProjectRow}
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
      columnManagementID={projectColumnManagementID}
      aria-label="Projects"
      data={data}
      Header={showMetrics ? headerWithMetrics : headerNoMetrics}
      Row={ProjectRow}
      EmptyMsg={data.length > 0 ? ProjectNotFoundMessage : ProjectEmptyMessage}
      customData={{ showMetrics }}
      virtualize
    />
  );
});
export const ProjectList = connect(
  null,
  mapDispatchToProps,
)(connectToFlags(FLAGS.CAN_CREATE_PROJET, FLAGS.CAN_GET_NS)(ProjectList_));

export const ProjectsPage = connectToFlags(
  FLAGS.CAN_CREATE_PROJECT,
  FLAGS.CAN_GET_NS,
)(({ flags, ...rest }) => {
  // Skip self-subject access review for projects since they use a special project request API.
  // `FLAGS.CAN_CREATE_PROJECT` determines if the user can create projects.
  const canGetNS = flags[FLAGS.CAN_GET_NS];
  const showMetrics = PROMETHEUS_BASE_PATH && canGetNS && window.screen.width >= 1200;
  const showActions = showMetrics;
  const selectedColumns = new Set(
    useSelector(({ UI }) => UI.getIn(['columnManagement', projectColumnManagementID])),
  );
  return (
    <ListPage
      {...rest}
      ListComponent={ProjectList}
      canCreate={flags[FLAGS.CAN_CREATE_PROJECT]}
      createHandler={() => createProjectModal({ blocking: true })}
      filterLabel="by name or display name"
      skipAccessReview
      textFilter="project-name"
      kind="Project"
      columnLayout={{
        columns: projectTableHeader({ showMetrics, showActions }).map((column) =>
          _.pick(column, ['title', 'additional', 'id']),
        ),
        id: projectColumnManagementID,
        selectedColumns,
        type: 'Project',
      }}
    />
  );
});

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
  const description = getDescription(ns);
  const requester = getRequester(ns);
  const serviceMeshEnabled = ns.metadata?.labels?.['maistra.io/member-of'];
  const canListSecrets = useAccessReview({
    group: SecretModel.apiGroup,
    resource: SecretModel.plural,
    verb: 'patch',
    namespace: ns.metadata.name,
  });

  return (
    <div className="row">
      <div className="col-sm-6 col-xs-12">
        {/* Labels aren't editable on kind Project, only Namespace. */}
        <ResourceSummary resource={ns} showLabelEditor={ns.kind === 'Namespace'}>
          <dt>Display Name</dt>
          <dd
            className={classNames({
              'text-muted': !displayName,
            })}
          >
            {displayName || 'No display name'}
          </dd>
          <dt>Description</dt>
          <dd>
            <p
              className={classNames({
                'text-muted': !description,
                'co-pre-wrap': description,
                'co-namespace-summary__description': description,
              })}
            >
              {description || 'No description'}
            </p>
          </dd>
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
          {serviceMeshEnabled && (
            <>
              <dt>Service Mesh</dt>
              <dd>
                <GreenCheckCircleIcon /> Service Mesh Enabled
              </dd>
            </>
          )}
        </dl>
      </div>
    </div>
  );
};

export const NamespaceDetails = ({ obj: ns, customData }) => {
  const [consoleLinks] = useK8sWatchResource({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
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
      navFactory.workloads(OverviewListPage),
      navFactory.roles(RolesPage),
    ]}
  />
);
