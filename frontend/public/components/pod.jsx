import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';

import { getRestartPolicyLabel, podPhase, podPhaseFilterReducer, podReadiness } from '../module/k8s/pods';
import { getContainerState, getContainerStatus } from '../module/k8s/docker';
import { ResourceEventStream } from './events';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
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
  StatusIcon,
  Timestamp,
  navFactory,
  units,
} from './utils';
import { PodLogs } from './pod-logs';
import { Line, requirePrometheus } from './graphs';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { formatDuration } from './utils/datetime';
import { CamelCaseWrap } from './utils/camel-case-wrap';
import { MountedVolumes } from './mounted-vol';

export const menuActions = [Kebab.factory.EditEnvironment, ...Kebab.factory.common];
const validReadinessStates = new Set(['ContainersNotReady', 'Ready', 'PodCompleted']);

/** @type {React.SFC.<{pod: string}>} */
export const Readiness = ({pod}) => {
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

export const PodRow = ({obj: pod}) => {
  const phase = podPhase(pod);

  return <ResourceRow obj={pod}>
    <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
      <ResourceLink kind="Pod" name={pod.metadata.name} namespace={pod.metadata.namespace} title={pod.metadata.uid} />
    </div>
    <div className="col-lg-2 col-md-2 col-sm-4 col-xs-6 co-break-word">
      <ResourceLink kind="Namespace" name={pod.metadata.namespace} title={pod.metadata.namespace} />
    </div>
    <div className="col-lg-2 col-md-3 col-sm-4 hidden-xs">
      <LabelList kind="Pod" labels={pod.metadata.labels} />
    </div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
      <NodeLink name={pod.spec.nodeName} />
    </div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs"><StatusIcon status={phase} /></div>
    <div className="col-lg-2 hidden-md hidden-sm hidden-xs"><Readiness pod={pod} /></div>
    <div className="dropdown-kebab-pf">
      <ResourceKebab actions={menuActions} kind="Pod" resource={pod} isDisabled={phase === 'Terminating'} />
    </div>
  </ResourceRow>;
};

PodRow.displayName = 'PodRow';

const PodHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 hidden-xs" sortField="metadata.labels">Pod Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.nodeName">Node</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortFunc="podPhase">Status</ColHead>
  <ColHead {...props} className="col-lg-2 hidden-md hidden-sm hidden-xs" sortFunc="podReadiness">Readiness</ColHead>
</ListHeader>;

const ContainerLink = ({pod, name}) => <span className="co-resource-item co-resource-item--inline">
  <ResourceIcon kind="Container" />
  <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>{name}</Link>
</span>;

export const ContainerRow = ({pod, container}) => {
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

export const PodContainerTable = ({heading, containers, pod}) => <React.Fragment>
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
      {containers.map((c, i) => <ContainerRow key={i} pod={pod} container={c} />)}
    </div>
  </div>
</React.Fragment>;

const PodGraphs = requirePrometheus(({pod}) => <React.Fragment>
  <div className="row">
    <div className="col-md-4">
      <Line title="Memory Usage" namespace={pod.metadata.namespace} query={`pod_name:container_memory_usage_bytes:sum{pod_name='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`} />
    </div>
    <div className="col-md-4">
      <Line title="CPU Usage" namespace={pod.metadata.namespace} query={`pod_name:container_cpu_usage:sum{pod_name='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`} />
    </div>
    <div className="col-md-4">
      <Line title="Filesystem" namespace={pod.metadata.namespace} query={`pod_name:container_fs_usage_bytes:sum{pod_name='${pod.metadata.name}',namespace='${pod.metadata.namespace}'}`} />
    </div>
  </div>

  <br />
</React.Fragment>);

export const PodStatus = ({pod}) => <StatusIcon status={podPhase(pod)} />;

export const PodDetailsList = ({pod}) => {
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

export const PodResourceSummary = ({pod}) => (
  <ResourceSummary resource={pod} showNodeSelector showTolerations>
    <dt>Node Selector</dt>
    <dd><Selector kind="Node" selector={pod.spec.nodeSelector} /></dd>
  </ResourceSummary>
);

const Details = ({obj: pod}) => {
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
      <MountedVolumes podTemplate={pod} heading="Mounted Volumes" />
    </div>
  </React.Fragment>;
};

const EnvironmentPage = (props) => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

const envPath = ['spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec}
  envPath={envPath}
  readOnly={true}
/>;

const PodExecLoader = ({obj}) => <div className="co-m-pane__body">
  <div className="row">
    <div className="col-xs-12">
      <div className="panel-body">
        <AsyncComponent loader={() => import('./pod-exec').then(c => c.PodExec)} obj={obj} />
      </div>
    </div>
  </div>
</div>;


/** @type {React.SFC<any>} */
export const PodsDetailsPage = props => <DetailsPage
  {...props}
  breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
    name: 'Pod Details',
    path: props.match.url,
  })}
  menuActions={menuActions}
  pages={[
    navFactory.details(Details),
    navFactory.editYaml(),
    navFactory.envEditor(environmentComponent),
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

export const PodList = props => <List {...props} Header={PodHeader} Row={PodRow} />;
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

export class PodsPage extends React.Component {
  shouldComponentUpdate(nextProps) {
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
