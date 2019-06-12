import * as React from 'react';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';

import { ContainerSpec, K8sResourceKindReference, PodKind } from '../module/k8s';
import { getRestartPolicyLabel, podPhase, podPhaseFilterReducer, podReadiness } from '../module/k8s/pods';
import { getContainerState, getContainerStatus } from '../module/k8s/container';
import { ResourceEventStream } from './events';
import { DetailsPage, ListPage, Table, TableRow, TableData } from './factory';
import {
  AsyncComponent,
  Kebab,
  LabelList,
  NodeLink,
  ResourceIcon,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  ScrollToTopOnMount,
  SectionHeading,
  Selector,
  StatusIconAndText,
  Timestamp,
  navFactory,
  units,
  humanizeCpuCores,
  humanizeDecimalBytes,
} from './utils';
import { PodLogs } from './pod-logs';
import { requirePrometheus, Area } from './graphs';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { formatDuration } from './utils/datetime';
import { CamelCaseWrap } from './utils/camel-case-wrap';
import { VolumesTable } from './volumes-table';

export const menuActions = [Kebab.factory.EditEnvironment, ...Kebab.factory.common];
const validReadinessStates = new Set(['ContainersNotReady', 'Ready', 'PodCompleted']);

export const Readiness: React.FC<ReadinessProps> = ({pod}) => {
  const readiness = podReadiness(pod);
  if (!readiness) {
    return null;
  }
  if (validReadinessStates.has(readiness)) {
    return <CamelCaseWrap value={readiness} />;
  }
  return <span className="co-error co-icon-and-text">
    <i className="fa fa-times-circle co-icon-and-text__icon" aria-hidden="true" />
    <CamelCaseWrap value={readiness} />
  </span>;
};
Readiness.displayName = 'Readiness';

const tableColumnClasses = [
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-2', 'col-sm-4', 'col-xs-6'),
  classNames('col-lg-2', 'col-md-3', 'col-sm-4', 'hidden-xs'),
  classNames('col-lg-2', 'col-md-2', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  classNames('col-lg-2', 'hidden-md', 'hidden-sm', 'hidden-xs'),
  Kebab.columnClass,
];

const kind = 'Pod';

const PodTableRow: React.FC<PodTableRowProps> = ({obj: pod, index, key, style}) => {
  const phase = podPhase(pod);
  return (
    <TableRow id={pod.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink kind={kind} name={pod.metadata.name} namespace={pod.metadata.namespace} title={pod.metadata.uid} />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={pod.metadata.namespace} title={pod.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={kind} labels={pod.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <NodeLink name={pod.spec.nodeName} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <StatusIconAndText status={phase} />
      </TableData>
      <TableData className={tableColumnClasses[5]}>
        <Readiness pod={pod} />
      </TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={kind} resource={pod} isDisabled={phase === 'Terminating'} />
      </TableData>
    </TableRow>
  );
};
PodTableRow.displayName = 'PodTableRow';
type PodTableRowProps = {
  obj: PodKind;
  index: number;
  key?: string;
  style: object;
};

const PodTableHeader = () => {
  return [
    {
      title: 'Name', sortField: 'metadata.name', transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace', sortField: 'metadata.namespace', transforms: [sortable],
      props: { className: tableColumnClasses[1] },
    },
    {
      title: 'Pod Labels', sortField: 'metadata.labels', transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Node', sortField: 'spec.nodeName', transforms: [sortable],
      props: { className: tableColumnClasses[3] },
    },
    {
      title: 'Status', sortFunc: 'podPhase', transforms: [sortable],
      props: { className: tableColumnClasses[4] },
    },
    {
      title: 'Readiness', sortFunc: 'podReadiness', transforms: [sortable],
      props: { className: tableColumnClasses[5] },
    },
    {
      title: '', props: { className: tableColumnClasses[6] },
    },
  ];
};
PodTableHeader.displayName = 'PodTableHeader';

const ContainerLink: React.FC<ContainerLinkProps> = ({pod, name}) => <span className="co-resource-item co-resource-item--inline">
  <ResourceIcon kind="Container" />
  <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>{name}</Link>
</span>;

export const ContainerRow: React.FC<ContainerRowProps> = ({pod, container}) => {
  const cstatus = getContainerStatus(pod, container.name);
  const cstate = getContainerState(cstatus);
  const startedAt = _.get(cstate, 'startedAt');
  const finishedAt = _.get(cstate, 'finishedAt');

  return <div className="row">
    <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">
      <ContainerLink pod={pod} name={container.name} />
    </div>
    <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7 co-truncate co-nowrap co-select-to-copy">{container.image || '-'}</div>
    <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs"><StatusIconAndText status={cstate.label} /></div>
    <div className="col-lg-1 col-md-2 hidden-sm hidden-xs">{_.get(cstatus, 'restartCount', '0')}</div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs"><Timestamp timestamp={startedAt} /></div>
    <div className="col-lg-2 hidden-md hidden-sm hidden-xs"><Timestamp timestamp={finishedAt} /></div>
    <div className="col-lg-1 hidden-md hidden-sm hidden-xs">{_.get(cstate, 'exitCode', '-')}</div>
  </div>;
};

export const PodContainerTable: React.FC<PodContainerTableProps> = ({heading, containers, pod}) => <React.Fragment>
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
      {containers.map((c: any, i: number) => <ContainerRow key={i} pod={pod} container={c} />)}
    </div>
  </div>
</React.Fragment>;

const PodGraphs = requirePrometheus(({pod}) => <React.Fragment>
  <div className="row">
    <div className="col-md-4">
      <Area
        title="Memory Usage"
        formatY={humanizeDecimalBytes}
        namespace={pod.metadata.namespace}
        query={`pod_name:container_memory_usage_bytes:sum{pod_name='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`}
      />
    </div>
    <div className="col-md-4">
      <Area
        title="CPU Usage"
        formatY={humanizeCpuCores}
        namespace={pod.metadata.namespace}
        query={`pod_name:container_cpu_usage:sum{pod_name='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`}
      />
    </div>
    <div className="col-md-4">
      <Area
        title="Filesystem"
        formatY={humanizeDecimalBytes}
        namespace={pod.metadata.namespace}
        query={`pod_name:container_fs_usage_bytes:sum{pod_name='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`}
      />
    </div>
  </div>

  <br />
</React.Fragment>);

export const PodStatus: React.FC<PodStatusProps> = ({pod}) => <StatusIconAndText status={podPhase(pod)} />;

export const PodDetailsList: React.FC<PodDetailsListProps> = ({pod}) => {
  const activeDeadlineSeconds = _.get(pod, 'spec.activeDeadlineSeconds');
  return <dl className="co-m-pane__details">
    <dt>Status</dt>
    <dd><PodStatus pod={pod} /></dd>
    <dt>Restart Policy</dt>
    <dd>{getRestartPolicyLabel(pod)}</dd>
    {
      activeDeadlineSeconds &&
        <React.Fragment>
          <dt>Active Deadline</dt>
          {/* Convert to ms for formatDuration */}
          <dd>{formatDuration(activeDeadlineSeconds * 1000)}</dd>
        </React.Fragment>
    }
    <dt>Pod IP</dt>
    <dd>{pod.status.podIP || '-'}</dd>
    <dt>Node</dt>
    <dd><NodeLink name={pod.spec.nodeName} /></dd>
  </dl>;
};

export const PodResourceSummary: React.FC<PodResourceSummaryProps> = ({pod}) => (
  <ResourceSummary resource={pod} showTolerations>
    <dt>Node Selector</dt>
    <dd><Selector kind="Node" selector={pod.spec.nodeSelector} /></dd>
  </ResourceSummary>
);

const Details: React.FC<PodDetailsProps> = ({obj: pod}) => {
  const limits = {
    cpu: null,
    memory: null,
  };
  limits.cpu = _.reduce(pod.spec.containers, (sum, container) => {
    const value = units.dehumanize(_.get(container, 'resources.limits.cpu', 0), 'numeric').value;
    return sum + value;
  }, 0);
  limits.memory = _.reduce(pod.spec.containers, (sum, container) => {
    const value = units.dehumanize(_.get(container, 'resources.limits.memory', 0), 'binaryBytesWithoutB').value;
    return sum + value;
  }, 0);

  return <React.Fragment>
    <ScrollToTopOnMount />
    <div className="co-m-pane__body">
      <SectionHeading text="Pod Overview" />
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
    {
      pod.spec.initContainers &&
      <div className="co-m-pane__body">
        <PodContainerTable key="initContainerTable" heading="Init Containers" containers={pod.spec.initContainers} pod={pod} />
      </div>
    }
    <div className="co-m-pane__body">
      <PodContainerTable key="containerTable" heading="Containers" containers={pod.spec.containers} pod={pod} />
    </div>
    <div className="co-m-pane__body">
      <VolumesTable podTemplate={pod} heading="Volumes" />
    </div>
  </React.Fragment>;
};

const EnvironmentPage = (props: any) => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

const envPath = ['spec','containers'];
const PodEnvironmentComponent = props => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec}
  envPath={envPath}
  readOnly={true}
/>;

const PodExecLoader: React.FC<PodExecLoaderProps> = ({obj}) => <div className="co-m-pane__body">
  <div className="row">
    <div className="col-xs-12">
      <div className="panel-body">
        <AsyncComponent loader={() => import('./pod-exec').then(c => c.PodExec)} obj={obj} />
      </div>
    </div>
  </div>
</div>;

export const PodsDetailsPage: React.FC<PodDetailsPageProps> = props => <DetailsPage
  {...props}
  breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
    name: 'Pod Details',
    path: props.match.url,
  })}
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
/>;
PodsDetailsPage.displayName = 'PodsDetailsPage';

export const PodList: React.FC = props => <Table {...props} aria-label="Pods" Header={PodTableHeader} Row={PodTableRow} virtualize />;
PodList.displayName = 'PodList';

const filters = [{
  type: 'pod-status',
  selected: [ 'Running', 'Pending', 'Terminating', 'CrashLoopBackOff' ],
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
    { id: 'Unknown', title: 'Unknown '},
  ],
}];

export class PodsPage extends React.Component<PodPageProps> {
  shouldComponentUpdate(nextProps: PodPageProps) {
    return !_.isEqual(nextProps, this.props);
  }
  render() {
    const { canCreate = true } = this.props;
    return <ListPage
      {...this.props}
      canCreate={canCreate}
      kind="Pod"
      ListComponent={PodList}
      rowFilters={filters}
    />;
  }
}

type ReadinessProps = {
  pod: PodKind;
};

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
};

type PodDetailsProps = {
  obj: PodKind;
};

type PodPageProps = {
  canCreate?: boolean;
  fieldSelector?: any;
  namespace?: string;
  selector?: any;
  showTitle?: boolean;
};

type PodDetailsPageProps = {
  kind: K8sResourceKindReference;
  match: any;
};
