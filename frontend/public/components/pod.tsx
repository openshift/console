/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';

import { coFetchJSON } from '../co-fetch';
import { ContainerSpec, K8sResourceKindReference, PodKind } from '../module/k8s';
import { getRestartPolicyLabel, podPhase, podPhaseFilterReducer, podReadiness } from '../module/k8s/pods';
import { getContainerState, getContainerStatus } from '../module/k8s/container';
import { UIActions } from '../ui/ui-actions';
import { ResourceEventStream } from './events';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import {
  AsyncComponent,
  Kebab,
  NodeLink,
  ResourceIcon,
  ResourceKebab,
  ResourceLink,
  ResourceSummary,
  ScrollToTopOnMount,
  SectionHeading,
  Selector,
  StatusIcon,
  Timestamp,
  formatBytesAsMiB,
  formatCores,
  navFactory,
  units,
  humanizeCpuCores,
  humanizeDecimalBytes,
} from './utils';
import { PodLogs } from './pod-logs';
import { Area, prometheusBasePath, prometheusTenancyBasePath, requirePrometheus } from './graphs';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { formatDuration, fromNow } from './utils/datetime';
import { CamelCaseWrap } from './utils/camel-case-wrap';
import { VolumesTable } from './volumes-table';

const hasMetrics = !!(prometheusBasePath && prometheusTenancyBasePath);
const fetchPodMetrics = (namespace: string): Promise<MetricsByPod> => {
  const metrics = [{
    key: 'memory',
    metric: 'pod_name:container_memory_usage_bytes:sum',
  }, {
    key: 'cpu',
    metric: 'pod_name:container_cpu_usage:sum',
  }];
  const promises = metrics.map(({key, metric}): Promise<MetricsByPod> => {
    const url = namespace
      ? `${prometheusTenancyBasePath}/api/v1/query?namespace=${namespace}&query=${metric}{namespace="${namespace}"}`
      : `${prometheusBasePath}/api/v1/query?query=${metric}`;
    return coFetchJSON(url).then(({ data: {result} }) => {
      return result.reduce((acc: MetricsByPod, data) => {
        const value = Number(data.value[1]);
        return _.set(acc, [key, data.metric.namespace, data.metric.pod_name], value);
      }, {});
    });
  });
  return Promise.all(promises).then((data: MetricsByPod[]) => _.assign({}, ...data));
};

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

const stateToProps = ({UI}) => ({
  metrics: UI.getIn(['metrics', 'pod']),
});

export const PodRow = connect(stateToProps)(({obj: pod, metrics}: PodRowProps) => {
  const phase = podPhase(pod);
  const { name, namespace, creationTimestamp } = pod.metadata;
  const bytes = _.get(metrics, ['memory', namespace, name]);
  const cores = _.get(metrics, ['cpu', namespace, name]);
  return <ResourceRow obj={pod}>
    <div className="col-md-2 col-sm-4 col-xs-6">
      <ResourceLink kind="Pod" name={name} namespace={namespace} />
    </div>
    <div className="col-md-2 col-sm-4 col-xs-6 co-break-word">
      <ResourceLink kind="Namespace" name={namespace} title={namespace} />
    </div>
    <div className="col-md-2 sol-sm-4 hidden-xs"><StatusIcon status={phase} /></div>
    <div className="col-md-2 hidden-sm hidden-xs"><Readiness pod={pod} /></div>
    {hasMetrics
      ? <React.Fragment>
        <div className="col-md-2 hidden-sm hidden-xs">{bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-'}</div>
        <div className="col-md-2 hidden-sm hidden-xs">{cores ? `${formatCores(cores)} Cores` : '-'}</div>
      </React.Fragment>
      : <React.Fragment>
        <div className="col-md-2 hidden-sm hidden-xs"><NodeLink name={pod.spec.nodeName} /></div>
        <div className="col-md-2 hidden-sm hidden-xs">{fromNow(creationTimestamp)}</div>
      </React.Fragment>}
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions} kind="Pod" resource={pod} isDisabled={phase === 'Terminating'} />
    </div>
  </ResourceRow>;
});
PodRow.displayName = 'PodRow';

const PodHeader = props => <ListHeader>
  <ColHead {...props} className="col-md-2 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-md-2 col-sm-4 hidden-xs" sortFunc="podPhase">Status</ColHead>
  <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortFunc="podReadiness">Readiness</ColHead>
  {hasMetrics
    ? <React.Fragment>
      <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortFunc="podMemory">Memory</ColHead>
      <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortFunc="podCPU">CPU</ColHead>
    </React.Fragment>
    : <React.Fragment>
      <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="spec.nodeName">Node</ColHead>
      <ColHead {...props} className="col-md-2 hidden-sm hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
    </React.Fragment>}
</ListHeader>;

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
    <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs"><StatusIcon status={cstate.label} /></div>
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
      <Area title="Memory Usage" humanizeValue={humanizeDecimalBytes} namespace={pod.metadata.namespace} query={`pod_name:container_memory_usage_bytes:sum{pod_name='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`} />
    </div>
    <div className="col-md-4">
      <Area title="CPU Usage" humanizeValue={humanizeCpuCores} namespace={pod.metadata.namespace} query={`pod_name:container_cpu_usage:sum{pod_name='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`} />
    </div>
    <div className="col-md-4">
      <Area title="Filesystem" humanizeValue={humanizeDecimalBytes} namespace={pod.metadata.namespace} query={`pod_name:container_fs_usage_bytes:sum{pod_name='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`} />
    </div>
  </div>

  <br />
</React.Fragment>);

export const PodStatus: React.FC<PodStatusProps> = ({pod}) => <StatusIcon status={podPhase(pod)} />;

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

export const PodList: React.FC = props => <List {...props} Header={PodHeader} Row={PodRow} />;
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

const dispatchToProps = (dispatch) => ({
  setPodMetrics: (metrics: MetricsByPod) => dispatch(UIActions.setPodMetrics(metrics)),
});

export const PodsPage = connect<{}, PodPagePropsFromDispatch, PodPageProps>(null, dispatchToProps)((props: PodPageProps & PodPagePropsFromDispatch) => {
  const { canCreate = true, namespace, setPodMetrics, ...listProps } = props;
  if (hasMetrics) {
    /* eslint-disable react-hooks/exhaustive-deps */
    React.useEffect(() => {
      const updateMetrics = () => fetchPodMetrics(namespace).then(setPodMetrics);
      updateMetrics();
      const id = setInterval(updateMetrics, 30 * 1000);
      return () => clearInterval(id);
    }, [namespace]);
    /* eslint-enable react-hooks/exhaustive-deps */
  }
  return (
    <ListPage
      {...listProps}
      canCreate={canCreate}
      kind="Pod"
      ListComponent={PodList}
      rowFilters={filters}
    />
  );
});

type MetricsByPod = {
  [metricKey: string]: {
    [namepsace: string]: {
      [name: string]: number;
    };
  };
};

type ReadinessProps = {
  pod: PodKind;
};

type PodRowProps = {
  obj: PodKind;
  metrics: MetricsByPod;
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

type PodPagePropsFromDispatch = {
  setPodMetrics: (metrics: MetricsByPod) => void;
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
