import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { Status } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';

import * as UIActions from '../actions/ui';
import { coFetchJSON } from '../co-fetch';
import { ContainerSpec, K8sResourceKindReference, PodKind } from '../module/k8s';
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
} from './utils';
import { PodLogs } from './pod-logs';
import {
  Area,
  Stack,
  PROMETHEUS_BASE_PATH,
  PROMETHEUS_TENANCY_BASE_PATH,
  requirePrometheus,
} from './graphs';
import { VolumesTable } from './volumes-table';
import { PodModel } from '../models';
import { Conditions } from './conditions';

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

const tableColumnClasses = [
  '',
  '',
  classNames('pf-m-hidden', 'pf-m-visible-on-sm'),
  classNames('pf-m-hidden', 'pf-m-visible-on-lg', 'pf-u-w-10-on-lg', 'pf-u-w-8-on-xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl', 'pf-u-w-8-on-2xl'),
  classNames('pf-m-hidden', 'pf-m-visible-on-xl'),
  classNames('pf-m-hidden', { 'pf-m-visible-on-xl pf-u-w-10-on-2xl': showMetrics }),
  classNames('pf-m-hidden', { 'pf-m-visible-on-xl pf-u-w-10-on-2xl': showMetrics }),
  classNames('pf-m-hidden', 'pf-m-visible-on-2xl pf-u-w-10-on-2xl'),
  Kebab.columnClass,
];

const kind = 'Pod';

const podRowStateToProps = ({ UI }) => ({
  metrics: UI.getIn(['metrics', 'pod']),
});

const PodTableRow = connect<PodTableRowPropsFromState, null, PodTableRowProps>(podRowStateToProps)(
  ({
    obj: pod,
    index,
    rowKey,
    style,
    metrics,
    showNodes,
  }: PodTableRowProps & PodTableRowPropsFromState) => {
    const { name, namespace, creationTimestamp } = pod.metadata;
    const { readyCount, totalContainers } = podReadiness(pod);
    const phase = podPhase(pod);
    const restarts = podRestarts(pod);
    const bytes: number = _.get(metrics, ['memory', namespace, name]);
    const cores: number = _.get(metrics, ['cpu', namespace, name]);
    return (
      <TableRow id={pod.metadata.uid} index={index} trKey={rowKey} style={style}>
        <TableData className={tableColumnClasses[0]}>
          <ResourceLink kind={kind} name={name} namespace={namespace} />
        </TableData>
        <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
          <ResourceLink kind="Namespace" name={namespace} />
        </TableData>
        <TableData className={tableColumnClasses[2]}>
          <Status status={phase} />
        </TableData>
        <TableData className={tableColumnClasses[3]}>
          {readyCount}/{totalContainers}
        </TableData>
        <TableData className={tableColumnClasses[4]}>{restarts}</TableData>
        <TableData className={tableColumnClasses[5]}>
          {showNodes ? (
            <ResourceLink kind="Node" name={pod.spec.nodeName} namespace={namespace} />
          ) : (
            <OwnerReferences resource={pod} />
          )}
        </TableData>
        <TableData className={tableColumnClasses[6]}>
          {bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-'}
        </TableData>
        <TableData className={tableColumnClasses[7]}>
          {cores ? `${formatCores(cores)} cores` : '-'}
        </TableData>
        <TableData className={tableColumnClasses[8]}>
          <Timestamp timestamp={creationTimestamp} />
        </TableData>
        <TableData className={tableColumnClasses[9]}>
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

const getHeader = (showNodes) => {
  return () => {
    return [
      {
        title: 'Name',
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: 'Namespace',
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
      },
      {
        title: 'Status',
        sortFunc: 'podPhase',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: 'Ready',
        sortFunc: 'podReadiness',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: 'Restarts',
        sortFunc: 'podRestarts',
        transforms: [sortable],
        props: { className: tableColumnClasses[4] },
      },
      {
        title: showNodes ? 'Node' : 'Owner',
        sortField: showNodes ? 'spec.nodeName' : 'metadata.ownerReferences[0].name',
        transforms: [sortable],
        props: { className: tableColumnClasses[5] },
      },
      {
        title: 'Memory',
        sortFunc: 'podMemory',
        transforms: [sortable],
        props: { className: tableColumnClasses[6] },
      },
      {
        title: 'CPU',
        sortFunc: 'podCPU',
        transforms: [sortable],
        props: { className: tableColumnClasses[7] },
      },
      {
        title: 'Created',
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[8] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[9] },
      },
    ];
  };
};

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
          limitQuery={`sum(kube_pod_container_resource_limits_memory_bytes{pod='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}) BY (pod, namespace)`}
          requestedQuery={`sum(kube_pod_container_resource_requests_memory_bytes{pod='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}) BY (pod, namespace)`}
        />
      </div>
      <div className="col-md-12 col-lg-4">
        <Area
          title="CPU Usage"
          humanize={humanizeCpuCores}
          namespace={pod.metadata.namespace}
          query={`pod:container_cpu_usage:sum{pod='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`}
          limitQuery={`sum(kube_pod_container_resource_limits_cpu_cores{pod='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}) BY (pod, namespace)`}
          requestedQuery={`sum(kube_pod_container_resource_requests_cpu_cores{pod='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}) BY (pod, namespace)`}
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
        <Stack
          title="Network In"
          humanize={humanizeDecimalBytesPerSec}
          namespace={pod.metadata.namespace}
          query={`(sum(irate(container_network_receive_bytes_total{pod='${pod.metadata.name}', namespace='${pod.metadata.namespace}'}[5m])) by (pod, namespace, interface)) + on(namespace,pod,interface) group_left(network_name) ( pod_network_name_info )`}
          metric="network_name"
        />
      </div>
      <div className="col-md-12 col-lg-4">
        <Stack
          title="Network Out"
          humanize={humanizeDecimalBytesPerSec}
          namespace={pod.metadata.namespace}
          query={`(sum(irate(container_network_transmit_bytes_total{pod='${pod.metadata.name}', namespace='${pod.metadata.namespace}'}[5m])) by (pod, namespace, interface)) + on(namespace,pod,interface) group_left(network_name) ( pod_network_name_info )`}
          metric="network_name"
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
  /* eslint-disable react-hooks/exhaustive-deps */
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
  }, [namespace]);
  /* eslint-enable react-hooks/exhaustive-deps */
  return (
    <ListPage
      {...listProps}
      canCreate={canCreate}
      kind="Pod"
      ListComponent={PodList}
      rowFilters={filters}
      namespace={namespace}
      customData={customData}
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
