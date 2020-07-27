import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { connect, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { Status } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';

import * as UIActions from '../actions/ui';
import { coFetchJSON } from '../co-fetch';
import { ContainerSpec, K8sResourceKindReference, PodKind, referenceForModel } from '../module/k8s';
import {
  getRestartPolicyLabel,
  podPhase,
  podPhaseFilterReducer,
  podReadiness,
  podRestarts,
} from '../module/k8s/pods';
import { getContainerState, getContainerStatus } from '../module/k8s/container';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunctionArgs } from './factory';
import {
  AsyncComponent,
  DetailsItem,
  Kebab,
  NodeLink,
  OwnerReferences,
  ResourceIcon,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  ScrollToTopOnMount,
  SectionHeading,
  Timestamp,
  formatBytesAsMiB,
  formatCores,
  humanizeBinaryBytes,
  humanizeDecimalBytesPerSec,
  humanizeCpuCores,
  navFactory,
  pluralize,
  units,
  LabelList,
} from './utils';
import { PodLogs } from './pod-logs';
import {
  Area,
  PROMETHEUS_BASE_PATH,
  PROMETHEUS_TENANCY_BASE_PATH,
  requirePrometheus,
} from './graphs';
import { VolumesTable } from './volumes-table';
import { PodModel } from '../models';
import { Conditions } from './conditions';
import { RootState } from '../redux';
import { ManagedColumn } from './modals/column-management-modal';

// Only request metrics if the device's screen width is larger than the
// breakpoint where metrics are visible.
const showMetrics =
  PROMETHEUS_BASE_PATH && PROMETHEUS_TENANCY_BASE_PATH && window.screen.width >= 1200;

const fetchPodMetrics = (namespace: string): Promise<UIActions.PodMetrics> => {
  const metrics = [
    {
      key: 'memory',
      query: namespace
        ? `sum(container_memory_working_set_bytes{namespace='${namespace}',container=''}) BY (pod, namespace)`
        : "sum(container_memory_working_set_bytes{container=''}) BY (pod, namespace)",
    },
    {
      key: 'cpu',
      query: namespace
        ? `pod:container_cpu_usage:sum{namespace='${namespace}'}`
        : 'pod:container_cpu_usage:sum',
    },
  ];
  const promises = metrics.map(
    ({ key, query }): Promise<UIActions.PodMetrics> => {
      const url = namespace
        ? `${PROMETHEUS_TENANCY_BASE_PATH}/api/v1/query?namespace=${namespace}&query=${query}`
        : `${PROMETHEUS_BASE_PATH}/api/v1/query?query=${query}`;
      return coFetchJSON(url).then(({ data: { result } }) => {
        return result.reduce((acc, data) => {
          const value = Number(data.value[1]);
          return _.set(acc, [key, data.metric.namespace, data.metric.pod], value);
        }, {});
      });
    },
  );
  return Promise.all(promises).then((data: any[]) => _.assign({}, ...data));
};

export const menuActions = [
  ...Kebab.getExtensionsActionsForKind(PodModel),
  ...Kebab.factory.common,
];

const podColumnInfo = {
  name: {
    classes: '',
    id: 'name',
    title: 'Name',
  },
  namespace: {
    classes: '',
    id: 'namespace',
    title: 'Namespace',
  },
  status: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
    id: 'status',
    title: 'Status',
  },
  ready: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-u-w-10-on-lg', 'pf-u-w-8-on-xl'),
    id: 'ready',
    title: 'Ready',
  },
  restarts: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-2xl', 'pf-u-w-8-on-2xl'),
    id: 'restarts',
    title: 'Restarts',
  },
  owner: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'owner',
    title: 'Owner',
  },
  node: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'node',
    title: 'Node',
  },
  memory: {
    classes: classNames('pf-m-hidden', { 'pf-m-visible-on-xl pf-u-w-10-on-2xl': showMetrics }),
    id: 'memory',
    title: 'Memory',
  },
  cpu: {
    classes: classNames('pf-m-hidden', { 'pf-m-visible-on-xl pf-u-w-10-on-2xl': showMetrics }),
    id: 'cpu',
    title: 'CPU',
  },
  created: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-2xl pf-u-w-10-on-2xl'),
    id: 'created',
    title: 'Created',
  },
  labels: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'labels',
    title: 'Labels',
  },
  ipaddress: {
    classes: classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
    id: 'ipaddress',
    title: 'IP Address',
  },
};

const kind = 'Pod';
const columnManagementID = referenceForModel(PodModel);

const podRowStateToProps = ({ UI }) => ({
  metrics: UI.getIn(['metrics', 'pod']),
  selectedColumns: UI.getIn(['columnManagement']),
});

const getHeader = (showNodes) => {
  return () => {
    return [
      {
        title: podColumnInfo.name.title,
        id: podColumnInfo.name.id,
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: podColumnInfo.name.classes },
        visible: true,
      },
      {
        title: podColumnInfo.namespace.title,
        id: podColumnInfo.namespace.id,
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: podColumnInfo.namespace.classes },
        visible: true,
      },
      {
        title: podColumnInfo.status.title,
        id: podColumnInfo.status.id,
        sortFunc: 'podPhase',
        transforms: [sortable],
        props: { className: podColumnInfo.status.classes },
        visible: true,
      },
      {
        title: podColumnInfo.ready.title,
        id: podColumnInfo.ready.id,
        sortFunc: 'podReadiness',
        transforms: [sortable],
        props: { className: podColumnInfo.ready.classes },
        visible: true,
      },
      {
        title: podColumnInfo.restarts.title,
        id: podColumnInfo.restarts.id,
        sortFunc: 'podRestarts',
        transforms: [sortable],
        props: { className: podColumnInfo.restarts.classes },
        visible: true,
      },
      {
        title: showNodes ? podColumnInfo.node.title : podColumnInfo.owner.title,
        id: podColumnInfo.owner.id,
        sortField: showNodes ? 'spec.nodeName' : 'metadata.ownerReferences[0].name',
        transforms: [sortable],
        props: { className: podColumnInfo.owner.classes },
        visible: true,
      },
      {
        title: podColumnInfo.memory.title,
        id: podColumnInfo.memory.id,
        sortFunc: 'podMemory',
        transforms: [sortable],
        props: { className: podColumnInfo.memory.classes },
        visible: true,
      },
      {
        title: podColumnInfo.cpu.title,
        id: podColumnInfo.cpu.id,
        sortFunc: 'podCPU',
        transforms: [sortable],
        props: { className: podColumnInfo.cpu.classes },
        visible: true,
      },
      {
        title: podColumnInfo.created.title,
        id: podColumnInfo.created.id,
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: podColumnInfo.created.classes },
        visible: true,
      },
      {
        title: podColumnInfo.node.title,
        id: podColumnInfo.node.id,
        sortField: 'spec.nodeName',
        transforms: [sortable],
        props: { className: podColumnInfo.node.classes },
        visible: false,
        additional: true,
      },
      {
        title: podColumnInfo.labels.title,
        id: podColumnInfo.labels.id,
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: podColumnInfo.labels.classes },
        visible: false,
        additional: true,
      },
      {
        title: podColumnInfo.ipaddress.title,
        id: podColumnInfo.ipaddress.id,
        sortField: 'status.hostIP',
        transforms: [sortable],
        props: { className: podColumnInfo.ipaddress.classes },
        visible: false,
        additional: true,
      },
      {
        title: '',
        props: { className: Kebab.columnClass },
        visible: true,
      },
    ];
  };
};

const PodTableRow = connect<PodTableRowPropsFromState, null, PodTableRowProps>(podRowStateToProps)(
  ({
    obj: pod,
    index,
    rowKey,
    style,
    metrics,
    showNodes,
    selectedColumns,
  }: PodTableRowProps & PodTableRowPropsFromState) => {
    const { name, namespace, creationTimestamp, labels } = pod.metadata;
    const { readyCount, totalContainers } = podReadiness(pod);
    const phase = podPhase(pod);
    const restarts = podRestarts(pod);
    const bytes: number = _.get(metrics, ['memory', namespace, name]);
    const cores: number = _.get(metrics, ['cpu', namespace, name]);
    const columns: ManagedColumn[] =
      selectedColumns?.get(columnManagementID) || getHeader(showNodes)();
    return (
      <TableRow id={pod.metadata.uid} index={index} trKey={rowKey} style={style}>
        <TableData className={podColumnInfo.name.classes}>
          <ResourceLink kind={kind} name={name} namespace={namespace} />
        </TableData>
        <TableData
          className={classNames(podColumnInfo.namespace.classes, 'co-break-word')}
          columns={columns}
          columnId={podColumnInfo.namespace.id}
        >
          <ResourceLink kind="Namespace" name={namespace} />
        </TableData>
        <TableData
          className={podColumnInfo.status.classes}
          columns={columns}
          columnId={podColumnInfo.status.id}
        >
          <Status status={phase} />
        </TableData>
        <TableData
          className={podColumnInfo.ready.classes}
          columns={columns}
          columnId={podColumnInfo.ready.id}
        >
          {readyCount}/{totalContainers}
        </TableData>
        <TableData
          className={podColumnInfo.restarts.classes}
          columns={columns}
          columnId={podColumnInfo.restarts.id}
        >
          {restarts}
        </TableData>
        <TableData
          className={podColumnInfo.owner.classes}
          columns={columns}
          columnId={podColumnInfo.owner.id}
        >
          {showNodes ? (
            <ResourceLink kind="Node" name={pod.spec.nodeName} namespace={namespace} />
          ) : (
            <OwnerReferences resource={pod} />
          )}
        </TableData>
        <TableData
          className={podColumnInfo.memory.classes}
          columns={columns}
          columnId={podColumnInfo.memory.id}
        >
          {bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-'}
        </TableData>
        <TableData
          className={podColumnInfo.cpu.classes}
          columns={columns}
          columnId={podColumnInfo.cpu.id}
        >
          {cores ? `${formatCores(cores)} cores` : '-'}
        </TableData>
        <TableData
          className={podColumnInfo.created.classes}
          columns={columns}
          columnId={podColumnInfo.created.id}
        >
          <Timestamp timestamp={creationTimestamp} />
        </TableData>
        <TableData
          className={podColumnInfo.node.classes}
          columns={columns}
          columnId={podColumnInfo.node.id}
        >
          <ResourceLink kind="Node" name={pod.spec.nodeName} namespace={namespace} />
        </TableData>
        <TableData
          className={podColumnInfo.labels.classes}
          columns={columns}
          columnId={podColumnInfo.labels.id}
        >
          <LabelList kind={kind} labels={labels} />
        </TableData>
        <TableData
          className={podColumnInfo.ipaddress.classes}
          columns={columns}
          columnId={podColumnInfo.ipaddress.id}
        >
          {pod?.status?.hostIP ?? '-'}
        </TableData>
        <TableData className={Kebab.columnClass}>
          <ResourceKebab
            actions={menuActions}
            kind={kind}
            resource={pod}
            isDisabled={phase === 'Terminating'}
          />
        </TableData>
      </TableRow>
    );
  },
);
PodTableRow.displayName = 'PodTableRow';

export const ContainerLink: React.FC<ContainerLinkProps> = ({ pod, name }) => (
  <span className="co-resource-item co-resource-item--inline">
    <ResourceIcon kind="Container" />
    <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>
      {name}
    </Link>
  </span>
);
ContainerLink.displayName = 'ContainerLink';

export const ContainerRow: React.FC<ContainerRowProps> = ({ pod, container }) => {
  const cstatus = getContainerStatus(pod, container.name);
  const cstate = getContainerState(cstatus);
  const startedAt = _.get(cstate, 'startedAt');
  const finishedAt = _.get(cstate, 'finishedAt');

  return (
    <div className="row">
      <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
        <ContainerLink pod={pod} name={container.name} />
      </div>
      <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7 co-truncate co-nowrap co-select-to-copy">
        {container.image || '-'}
      </div>
      <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">
        <Status status={cstate.label} />
      </div>
      <div className="col-lg-1 col-md-2 hidden-sm hidden-xs">
        {_.get(cstatus, 'restartCount', '0')}
      </div>
      <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
        <Timestamp timestamp={startedAt} />
      </div>
      <div className="col-lg-2 hidden-md hidden-sm hidden-xs">
        <Timestamp timestamp={finishedAt} />
      </div>
      <div className="col-lg-1 hidden-md hidden-sm hidden-xs">{_.get(cstate, 'exitCode', '-')}</div>
    </div>
  );
};

export const PodContainerTable: React.FC<PodContainerTableProps> = ({
  heading,
  containers,
  pod,
}) => (
  <>
    <SectionHeading text={heading} />
    <div className="co-m-table-grid co-m-table-grid--bordered">
      <div className="row co-m-table-grid__head">
        <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">Name</div>
        <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">Image</div>
        <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">State</div>
        <div className="col-lg-1 col-md-2 hidden-sm hidden-xs">Restarts</div>
        <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">Started</div>
        <div className="col-lg-2 hidden-md hidden-sm hidden-xs">Finished</div>
        <div className="col-lg-1 hidden-md hidden-sm hidden-xs">Exit Code</div>
      </div>
      <div className="co-m-table-grid__body">
        {containers.map((c: any, i: number) => (
          <ContainerRow key={i} pod={pod} container={c} />
        ))}
      </div>
    </div>
  </>
);

const PodGraphs = requirePrometheus(({ pod }) => (
  <>
    <div className="row">
      <div className="col-md-12 col-lg-4">
        <Area
          title="Memory Usage"
          humanize={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          namespace={pod.metadata.namespace}
          query={`sum(container_memory_working_set_bytes{pod='${pod.metadata.name}',namespace='${pod.metadata.namespace}',container='',}) BY (pod, namespace)`}
        />
      </div>
      <div className="col-md-12 col-lg-4">
        <Area
          title="CPU Usage"
          humanize={humanizeCpuCores}
          namespace={pod.metadata.namespace}
          query={`pod:container_cpu_usage:sum{pod='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`}
        />
      </div>
      <div className="col-md-12 col-lg-4">
        <Area
          title="Filesystem"
          humanize={humanizeBinaryBytes}
          byteDataType={ByteDataTypes.BinaryBytes}
          namespace={pod.metadata.namespace}
          query={`pod:container_fs_usage_bytes:sum{pod='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`}
        />
      </div>
    </div>
    <div className="row">
      <div className="col-md-12 col-lg-4">
        <Area
          title="Network In"
          humanize={humanizeDecimalBytesPerSec}
          namespace={pod.metadata.namespace}
          query={`sum(irate(container_network_receive_bytes_total{pod='${pod.metadata.name}', namespace='${pod.metadata.namespace}'}[5m])) by (pod, namespace)`}
        />
      </div>
      <div className="col-md-12 col-lg-4">
        <Area
          title="Network Out"
          humanize={humanizeDecimalBytesPerSec}
          namespace={pod.metadata.namespace}
          query={`sum(irate(container_network_transmit_bytes_total{pod='${pod.metadata.name}', namespace='${pod.metadata.namespace}'}[5m])) by (pod, namespace)`}
        />
      </div>
    </div>

    <br />
  </>
));

export const PodStatus: React.FC<PodStatusProps> = ({ pod }) => <Status status={podPhase(pod)} />;

export const PodDetailsList: React.FC<PodDetailsListProps> = ({ pod }) => {
  return (
    <dl className="co-m-pane__details">
      <dt>Status</dt>
      <dd>
        <PodStatus pod={pod} />
      </dd>
      <DetailsItem label="Restart Policy" obj={pod} path="spec.restartPolicy">
        {getRestartPolicyLabel(pod)}
      </DetailsItem>
      <DetailsItem label="Active Deadline Seconds" obj={pod} path="spec.activeDeadlineSeconds">
        {pod.spec.activeDeadlineSeconds
          ? pluralize(pod.spec.activeDeadlineSeconds, 'second')
          : 'Not Configured'}
      </DetailsItem>
      <DetailsItem label="Pod IP" obj={pod} path="status.podIP" />
      <DetailsItem label="Node" obj={pod} path="spec.nodeName" hideEmpty>
        <NodeLink name={pod.spec.nodeName} />
      </DetailsItem>
    </dl>
  );
};

export const PodResourceSummary: React.FC<PodResourceSummaryProps> = ({ pod }) => (
  <ResourceSummary
    resource={pod}
    showNodeSelector
    nodeSelector="spec.nodeSelector"
    showTolerations
  />
);

const Details: React.FC<PodDetailsProps> = ({ obj: pod }) => {
  const limits = {
    cpu: null,
    memory: null,
  };
  limits.cpu = _.reduce(
    pod.spec.containers,
    (sum, container) => {
      const value = units.dehumanize(_.get(container, 'resources.limits.cpu', 0), 'numeric').value;
      return sum + value;
    },
    0,
  );
  limits.memory = _.reduce(
    pod.spec.containers,
    (sum, container) => {
      const value = units.dehumanize(
        _.get(container, 'resources.limits.memory', 0),
        'binaryBytesWithoutB',
      ).value;
      return sum + value;
    },
    0,
  );

  return (
    <>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text="Pod Details" />
        <PodGraphs pod={pod} />
        <div className="row">
          <div className="col-sm-6">
            <PodResourceSummary pod={pod} />
          </div>
          <div className="col-sm-6">
            <PodDetailsList pod={pod} />
          </div>
        </div>
      </div>
      {pod.spec.initContainers && (
        <div className="co-m-pane__body">
          <PodContainerTable
            key="initContainerTable"
            heading="Init Containers"
            containers={pod.spec.initContainers}
            pod={pod}
          />
        </div>
      )}
      <div className="co-m-pane__body">
        <PodContainerTable
          key="containerTable"
          heading="Containers"
          containers={pod.spec.containers}
          pod={pod}
        />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={pod} heading="Volumes" />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Conditions" />
        <Conditions conditions={pod.status.conditions} />
      </div>
    </>
  );
};

const EnvironmentPage = (props: any) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

const envPath = ['spec', 'containers'];
const PodEnvironmentComponent = (props) => (
  <EnvironmentPage obj={props.obj} rawEnvData={props.obj.spec} envPath={envPath} readOnly={true} />
);

export const PodExecLoader: React.FC<PodExecLoaderProps> = ({ obj, message }) => (
  <div className="co-m-pane__body">
    <div className="row">
      <div className="col-xs-12">
        <div className="panel-body">
          <AsyncComponent
            loader={() => import('./pod-exec').then((c) => c.PodExec)}
            obj={obj}
            message={message}
          />
        </div>
      </div>
    </div>
  </div>
);

export const PodsDetailsPage: React.FC<PodDetailsPageProps> = (props) => (
  <DetailsPage
    {...props}
    getResourceStatus={podPhase}
    menuActions={menuActions}
    pages={[
      navFactory.details(Details),
      navFactory.editYaml(),
      navFactory.envEditor(PodEnvironmentComponent),
      navFactory.logs(PodLogs),
      navFactory.events(ResourceEventStream),
      {
        href: 'terminal',
        name: 'Terminal',
        component: PodExecLoader,
      },
    ]}
  />
);
PodsDetailsPage.displayName = 'PodsDetailsPage';

const getRow = (showNodes) => {
  return (rowArgs: RowFunctionArgs<PodKind>) => (
    <PodTableRow
      obj={rowArgs.obj}
      index={rowArgs.index}
      rowKey={rowArgs.key}
      style={rowArgs.style}
      showNodes={showNodes}
    />
  );
};

export const PodList: React.FC<PodListProps> = (props) => {
  const showNodes = props?.customData?.showNodes;
  return (
    <Table
      {...props}
      columnManagementID={columnManagementID}
      aria-label="Pods"
      Header={getHeader(showNodes)}
      Row={getRow(showNodes)}
      virtualize
    />
  );
};
PodList.displayName = 'PodList';

export const filters = [
  {
    filterGroupName: 'Status',
    type: 'pod-status',
    reducer: podPhaseFilterReducer,
    items: [
      { id: 'Running', title: 'Running' },
      { id: 'Pending', title: 'Pending' },
      { id: 'Terminating', title: 'Terminating' },
      { id: 'CrashLoopBackOff', title: 'CrashLoopBackOff' },
      // Use title "Completed" to match what appears in the status column for the pod.
      // The pod phase is "Succeeded," but the container state is "Completed."
      { id: 'Succeeded', title: 'Completed' },
      { id: 'Failed', title: 'Failed' },
      { id: 'Unknown', title: 'Unknown ' },
    ],
  },
];

const dispatchToProps = (dispatch): PodPagePropsFromDispatch => ({
  setPodMetrics: (metrics) => dispatch(UIActions.setPodMetrics(metrics)),
});

export const PodsPage = connect<{}, PodPagePropsFromDispatch, PodPageProps>(
  null,
  dispatchToProps,
)((props: PodPageProps & PodPagePropsFromDispatch) => {
  const { canCreate = true, namespace, setPodMetrics, customData, ...listProps } = props;
  let selectedColumns = useSelector<RootState, string>(({ UI }) =>
    UI.getIn(['columnManagement', columnManagementID]),
  );
  if (_.isEmpty(selectedColumns)) {
    selectedColumns = getHeader(props?.customData?.showNodes)();
  }
  React.useEffect(() => {
    if (showMetrics) {
      const updateMetrics = () =>
        fetchPodMetrics(namespace)
          .then(setPodMetrics)
          .catch((e) => {
            // Just log the error here. Showing a warning alert could be more annoying
            // than helpful. It should be obvious there are no metrics in the list, and
            // if monitoring is broken, it'll be really apparent since none of the
            // graphs and dashboards will load in the UI.
            // eslint-disable-next-line no-console
            console.error('Unable to fetch pod metrics', e);
          });
      updateMetrics();
      const id = setInterval(updateMetrics, 30 * 1000);
      return () => clearInterval(id);
    }
  }, [namespace, setPodMetrics]);
  /* eslint-enable react-hooks/exhaustive-deps */
  return (
    <ListPage
      {...listProps}
      canCreate={canCreate}
      kind={kind}
      ListComponent={PodList}
      rowFilters={filters}
      namespace={namespace}
      customData={customData}
      selectedColumns={selectedColumns}
      columnManagementID={columnManagementID}
      columnManagementType="Pod"
    />
  );
});

type ContainerLinkProps = {
  pod: PodKind;
  name: string;
};

type ContainerRowProps = {
  pod: PodKind;
  container: ContainerSpec;
};

type PodContainerTableProps = {
  heading: string;
  containers: ContainerSpec[];
  pod: PodKind;
};

type PodStatusProps = {
  pod: PodKind;
};

type PodResourceSummaryProps = {
  pod: PodKind;
};

type PodDetailsListProps = {
  pod: PodKind;
};

type PodExecLoaderProps = {
  obj: PodKind;
  message?: React.ReactElement;
};

type PodDetailsProps = {
  obj: PodKind;
};

type PodTableRowProps = {
  obj: PodKind;
  index: number;
  rowKey: string;
  style: object;
  showNodes?: boolean;
};

type PodTableRowPropsFromState = {
  metrics: UIActions.PodMetrics;
  selectedColumns: Map<string, ManagedColumn[]>;
};

type PodListProps = {
  customData?: any;
};

type PodPageProps = {
  canCreate?: boolean;
  fieldSelector?: any;
  namespace?: string;
  selector?: any;
  showTitle?: boolean;
  customData?: any;
};

type PodPagePropsFromDispatch = {
  setPodMetrics: (metrics) => void;
};

type PodDetailsPageProps = {
  kind: K8sResourceKindReference;
  match: any;
};
