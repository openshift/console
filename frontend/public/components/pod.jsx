import * as React from 'react';
import { Link } from 'react-router-dom';
import * as _ from 'lodash-es';

import { getVolumeType, getVolumeLocation, getVolumeMountPermissions, getVolumeMountsByPermissions, getRestartPolicyLabel, podPhase, podReadiness } from '../module/k8s/pods';
import { getContainerState, getContainerStatus } from '../module/k8s/docker';
import { ResourceEventStream } from './events';
import { ColHead, DetailsPage, List, ListHeader, ListPage, ResourceRow } from './factory';
import { Cog, LabelList, navFactory, Overflow, ResourceCog, ResourceIcon, ResourceLink, ResourceSummary, Selector, Timestamp, VolumeIcon, units, AsyncComponent} from './utils';
import { PodLogs } from './pod-logs';
import { registerTemplate } from '../yaml-templates';
import { Line } from './graphs';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { EnvironmentPage } from './environment';

const menuActions = [Cog.factory.EditEnvironment, ...Cog.factory.common];
const validReadinessStates = new Set(['Ready', 'PodCompleted']);
const validStatuses = new Set(['Running', 'Completed']);

registerTemplate('v1.Pod', `apiVersion: v1
kind: Pod
metadata:
  name: example
  labels:
    app: hello-openshift
spec:
  containers:
    - name: hello-openshift
      image: openshift/hello-openshift
      ports:
        - containerPort: 8080`);


/** @type {React.SFC.<{pod: string}>} */
export const Readiness = ({pod}) => {
  const readiness = podReadiness(pod);
  if (!readiness) {
    return null;
  }
  if (validReadinessStates.has(readiness)) {
    return <span>{readiness}</span>;
  }
  return <span className="co-error">
    <i className="fa fa-times-circle co-icon-space-r" />
    {readiness}
  </span>;
};

Readiness.displayName = 'Readiness';

export const PodRow = ({obj: pod, style}) => {
  const phase = podPhase(pod);
  let status = phase;

  if (!validStatuses.has(status)) {
    status = <span className="co-error">
      <i className="fa fa-times-circle co-icon-space-r" />{phase}
    </span>;
  }

  return <ResourceRow obj={pod} style={style}>
    <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
      <ResourceCog actions={menuActions} kind="Pod" resource={pod} isDisabled={phase === 'Terminating'} />
      <ResourceLink kind="Pod" name={pod.metadata.name} namespace={pod.metadata.namespace} title={pod.metadata.uid} />
    </div>
    <div className="col-lg-2 col-md-3 col-sm-4 col-xs-6">
      <ResourceLink kind="Namespace" name={pod.metadata.namespace} title={pod.metadata.namespace} />
    </div>
    <div className="col-lg-3 col-md-3 col-sm-4 hidden-xs">
      <LabelList kind="Pod" labels={pod.metadata.labels} />
    </div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">
      <NodeLink name={pod.spec.nodeName} />
    </div>
    <div className="col-lg-2 col-md-1 hidden-sm hidden-xs">{status}</div>
    <div className="col-lg-1 hidden-md hidden-sm hidden-xs"><Readiness pod={pod} /></div>
  </ResourceRow>;
};

PodRow.displayName = 'PodRow';

const PodHeader = props => <ListHeader>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-3 col-sm-4 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-lg-3 col-md-3 col-sm-4 hidden-xs" sortField="metadata.labels">Pod Labels</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-2 hidden-sm hidden-xs" sortField="spec.nodeName">Node</ColHead>
  <ColHead {...props} className="col-lg-2 col-md-1 hidden-sm hidden-xs" sortFunc="podPhase">Status</ColHead>
  <ColHead {...props} className="col-lg-1 hidden-md hidden-sm hidden-xs" sortFunc="podReadiness">Readiness</ColHead>
</ListHeader>;

const ContainerLink = ({pod, name}) => <span className="co-resource-link">
  <ResourceIcon kind="Container" />
  <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>{name}</Link>
</span>;

const NodeLink = ({name}) => name ? <Link to={`/k8s/cluster/nodes/${name}`}>{name}</Link> : <span>-</span>;

export const ContainerRow = ({pod, container}) => {
  const cstatus = getContainerStatus(pod, container.name);
  const cstate = getContainerState(cstatus);

  const fixes = _.get(pod.metadata, 'labels[secscan/fixables]');

  return <div className="row">
    <div className="middler">
      <div className="col-sm-2 col-xs-4">
        <ContainerLink pod={pod} name={container.name} />
      </div>
      <Overflow className="col-sm-2 hidden-xs" value={_.get(cstatus, 'containerID', '-')} />
      <Overflow className="col-sm-2 col-xs-8" value={container.image} />
      <div className="col-md-2 col-sm-2 hidden-xs">{fixes ? `${fixes} fixable packages` : '-'}</div>
      <div className="col-md-1 col-sm-2 hidden-xs">{_.get(cstate, 'label', '-')}</div>
      <div className="col-md-1 col-sm-2 hidden-xs">{_.get(cstatus, 'restartCount', '0')}</div>
      <div className="col-md-2 hidden-sm hidden-xs"><Timestamp timestamp={_.get(cstate, 'startedAt')} /></div>
    </div>
  </div>;
};

const Volume = ({pod, volume}) => {
  const kind = _.get(getVolumeType(volume.volume), 'id', '');
  const loc = getVolumeLocation(volume.volume);
  const mountPermissions = getVolumeMountPermissions(volume);

  return <div className="row">
    <div className="middler">
      <Overflow className="col-sm-3 col-xs-4 co-truncate" value={volume.name} />
      <div className="col-sm-3 col-xs-4">
        <VolumeIcon kind={kind} />
        <span className="co-break-word">{loc && ` (${loc})`}</span>
      </div>
      <div className="col-sm-3 hidden-xs">{mountPermissions}</div>
      <div className="col-sm-3 col-xs-4">
        {volume.mounts.map((m, i) => <div key={i}>
          <ContainerLink pod={pod} name={m.container} />
          {i < volume.mounts.length - 1 && ', '}
        </div>)}
      </div>
    </div>
  </div>;
};

const Details = ({obj: pod}) => {
  const limits = {
    cpu: null,
    memory: null
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
    <div className="co-m-pane__body">
      <h1 className="co-section-title">Pod Overview</h1>
      <div className="row">
        <div className="col-md-4">
          <Line title="RAM" query={`pod_name:container_memory_usage_bytes:sum{pod_name='${pod.metadata.name}'}`} />
        </div>
        <div className="col-md-4">
          <Line title="CPU Shares" query={`pod_name:container_cpu_usage:sum{pod_name='${pod.metadata.name}'} * 1000`} />
        </div>
        <div className="col-md-4">
          <Line title="Filesystem (bytes)" query={`pod_name:container_fs_usage_bytes:sum{pod_name='${pod.metadata.name}'}`} />
        </div>
      </div>

      <br />

      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={pod} showPodSelector={false} showNodeSelector={false}>
            <dt>Node Selector</dt>
            <dd><Selector kind="Node" selector={pod.spec.nodeSelector} /></dd>
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <dl className="co-m-pane__details">
            <dt>Status</dt>
            <dd>{podPhase(pod)}</dd>
            <dt>Pod IP</dt>
            <dd>{pod.status.podIP || '-'}</dd>
            <dt>Node</dt>
            <dd><NodeLink name={pod.spec.nodeName} /></dd>
            <dt>Restart Policy</dt>
            <dd>{getRestartPolicyLabel(pod)}</dd>
          </dl>
        </div>
      </div>

    </div>

    <div className="co-m-pane__body">
      <h1 className="co-section-title">Containers</h1>
      <div className="row">
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-sm-2 col-xs-4">Name</div>
            <div className="col-sm-2 hidden-xs">Id</div>
            <div className="col-sm-2 col-xs-8">Image</div>
            <div className="col-md-2 col-sm-2 hidden-xs">Security Scan</div>
            <div className="col-md-1 col-sm-2 hidden-xs">State</div>
            <div className="col-md-1 col-sm-2 hidden-xs">Restart Count</div>
            <div className="col-md-2 hidden-sm hidden-xs">Started At</div>
          </div>
          <div className="co-m-table-grid__body">
            {pod.spec.containers.map((c, i) => <ContainerRow key={i} pod={pod} container={c} />)}
          </div>
        </div>
      </div>
    </div>

    <div className="co-m-pane__body">
      <h1 className="co-section-title">Pod Volumes</h1>
      <div className="row">
        <div className="co-m-table-grid co-m-table-grid--bordered">
          <div className="row co-m-table-grid__head">
            <div className="col-sm-3 col-xs-4">Name</div>
            <div className="col-sm-3 col-xs-4">Type</div>
            <div className="col-sm-3 hidden-xs">Permissions</div>
            <div className="col-sm-3 col-xs-4">Utilized By</div>
          </div>
          <div className="co-m-table-grid__body">
            {getVolumeMountsByPermissions(pod).map((v, i) => <Volume key={i} pod={pod} volume={v} />)}
          </div>
        </div>
      </div>
    </div>
  </React.Fragment>;
};

const envPath = ['spec','containers'];
const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.containers}
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
  selected: ['Running', 'Pending', 'Terminating', 'CrashLoopBackOff'],
  reducer: podPhase,
  items: [
    {id: 'Running', title: 'Running'},
    {id: 'Pending', title: 'Pending'},
    {id: 'Terminating', title: 'Terminating'},
    {id: 'CrashLoopBackOff', title: 'CrashLoopBackOff'},
    {id: 'Completed', title: 'Job Completed'},
  ],
}];

export class PodsPage extends React.Component {
  shouldComponentUpdate(nextProps) {
    return !_.isEqual(nextProps, this.props);
  }
  render() {
    return <ListPage
      {...this.props}
      canCreate={true}
      kind="Pod"
      ListComponent={PodList}
      rowFilters={filters}
    />;
  }
}
