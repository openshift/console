import React from 'react';

import {angulars} from './react-wrapper';
import {makeListPage, makeList, makeDetailsPage} from './factory';
import {Cog, LabelList, Overflow, podPhase, ResourceIcon, Timestamp, VolumeIcon, units} from './utils';
import {SparklineWidget} from './sparkline-widget/sparkline-widget';

const PodCog = ({pod, isDisabled}) => {
  const kind = angulars.kinds.POD;
  const {factory: {ModifyLabels, Delete}} = Cog;

  return <Cog options={[ModifyLabels, Delete].map(f => f(kind, pod))} size="small" anchor="left" isDisabled={isDisabled} />;
};

const readiness = ({status}) => {
  if (_.isEmpty(status.conditions)) {
    return null;
  }

  let allReady = true;
  const conditions = _.map(status.conditions, c => {
    if (c.status !== 'True') {
      allReady = false;
    }
    return Object.assign({time: new Date(c.lastTransitionTime)}, c);
  });

  if (allReady) {
    return 'Ready';
  }

  let earliestNotReady = null;
  _.each(conditions, c => {
    if (c.status === 'True') {
      return;
    }
    if (!earliestNotReady) {
      earliestNotReady = c;
      return;
    }
    if (c.time < earliestNotReady.time) {
      earliestNotReady = c;
    }
  });

  const reason = earliestNotReady.reason || earliestNotReady.type;

  return <span className="co-error" >
    <i className="fa fa-times-circle co-icon-space-r" />
    {reason}
  </span>;
};

const PodRow = ({obj: pod}) => {
  const phase = podPhase(pod);
  let status = phase;

  if (status !== 'Running') {
    status = <span className="co-error" >
      <i className="fa fa-times-circle co-icon-space-r" />{phase}
    </span>;
  }

  return <div className="row co-resource-list__item">
    <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">
      <PodCog pod={pod} key={'cog'} isDisabled={phase === 'Terminating'} />
      <ResourceIcon kind="pod" />
      <a href={`ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/details`} title={pod.metadata.uid}>{pod.metadata.name}</a>
    </div>
    <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">
      <LabelList kind="pod" labels={pod.metadata.labels}  />
    </div>

    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">{status}</div>
    <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">{readiness(pod)}</div>
    <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">
      <NodeLink name={pod.spec.nodeName} />
    </div>
  </div>;
};

const PodHeader = () => <div className="row co-m-table-grid__head">
  <div className="col-lg-3 col-md-3 col-sm-3 col-xs-6">Pod Name</div>
  <div className="col-lg-3 col-md-3 col-sm-4 col-xs-6">Pod Labels</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Status</div>
  <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">Readiness</div>
  <div className="col-lg-2 col-md-2 col-sm-2 hidden-xs">Node</div>
</div>;

const filters = [{
  type: 'pod-status',
  selected: [0, 1, 2],
  reducer: podPhase,
  items: [
    ['Running', 'Running'],
    ['Pending', 'Pending'],
    ['Terminating', 'Terminating'],
    ['Job Completed', 'Completed'],
  ],
}];

const ContainerLink = ({pod, name}) => <a href={`ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}/details`}>{name}</a>;

const NodeLink = ({name}) => name ? <a href={`nodes/${name}`}>{name}</a> : <span>-</span>;

const ContainerRow = ({pod, container}) => {
  const cstatus = angulars.k8s.docker.getStatus(pod, container.name);
  const cstate = angulars.k8s.docker.getState(cstatus);

  return <div className="row">
    <div className="middler">
      <div className="col-sm-2 col-xs-4">
        <ResourceIcon kind="container" />
        <ContainerLink pod={pod} name={container.name} />
      </div>
      <Overflow className="col-sm-3 hidden-xs" value={_.get(cstatus, 'containerID', '-')} />
      <div className="col-sm-3 col-xs-8">{container.image}</div>
      <div className="col-md-1 col-sm-2 hidden-xs">{_.get(cstate, 'label', '-')}</div>
      <div className="col-md-1 col-sm-2 hidden-xs">{_.get(cstatus, 'restartCount', '0')}</div>
      <div className="col-md-2 hidden-sm  hidden-xs"><Timestamp timestamp={_.get(cstate, 'startedAt')} /></div>
    </div>
  </div>;
};

const Volume = ({pod, volume}) => {
  const kind = _.get(angulars.k8s.pods.getVolumeType(volume.volume), 'id', '');
  const loc = angulars.k8s.pods.getVolumeLocation(volume.volume);
  const mountPermissions = angulars.k8s.pods.getVolumeMountPermissions(volume);

  return <div className="row">
    <div className="middler">
      <Overflow className="col-sm-3 col-xs-4 co-truncate" value={volume.name} />
      <div className="col-sm-3 col-xs-4">
        <VolumeIcon kind={kind} />
        <span>{loc && ` (${loc})`}</span>
      </div>
      <div className="col-sm-3 hidden-xs">{mountPermissions}</div>
      <div className="col-sm-3 col-xs-4">
        {volume.mounts.map((m, i) => <div key={i} className="co-m-resource-icon-wrapper">
          <ResourceIcon kind="container" />
          <ContainerLink pod={pod} name={m.container} />
          {i < volume.mounts.length - 1 && ', '}
        </div>)}
      </div>
    </div>
  </div>;
};

const Details = (pod) => {
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

  return <div>
    <div className="co-m-pane__body">
      <div className="co-m-pane__body-section--bordered">
        <h1 className="co-section-title">Pod Overview</h1>
        <div className="co-sparkline-wrapper">
          <div className="row no-gutter">
            <div className="col-md-4">
              <SparklineWidget heading="RAM" query={`pod_name:container_memory_usage_bytes:sum{pod_name='${pod.metadata.name}'}`} limit={limits.memory} units="binaryBytes"></SparklineWidget>
            </div>
            <div className="col-md-4">
              <SparklineWidget heading="CPU Shares" query={`pod_name:container_spec_cpu_shares:sum{pod_name='${pod.metadata.name}'} * 1000000`} limit={limits.cpu} units="numeric"></SparklineWidget>
            </div>
            <div className="col-md-4">
              <SparklineWidget heading="Filesystem" query={`pod_name:container_fs_usage_bytes:sum{pod_name='${pod.metadata.name}'}`} units="decimalBytes"></SparklineWidget>
            </div>
          </div>
        </div>
        <div className="row no-gutter">
          <div className="col-sm-8 col-xs-12">
            <div className="row">
              <div className="col-sm-6 col-xs-12">
                <dl>
                  <dt>Pod Name</dt>
                  <dd>{pod.metadata.name || '-'}</dd>
                  <dt>Pod Labels</dt>
                  <dd><LabelList kind="pod" labels={pod.metadata.labels} /></dd>
                  <dt>Created At</dt>
                  <dd><Timestamp timestamp={pod.metadata.creationTimestamp} /></dd>
                  <dt>Node Selector</dt>
                  <dd><LabelList kind="node" labels={pod.spec.nodeSelector} /></dd>
                </dl>
              </div>
              <div className="col-sm-6 col-xs-12">
                <dl>
                  <dt>Status</dt>
                  <dd>{podPhase(pod)}</dd>
                  <dt>Pod IP</dt>
                  <dd>{pod.status.podIP || '-'}</dd>
                  <dt>Node</dt>
                  <dd><NodeLink name={pod.spec.nodeName} /></dd>
                  <dt>Restart Policy</dt>
                  <dd>{angulars.k8s.pods.getRestartPolicyLabelById(pod.spec.restartPolicy)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="co-m-pane__body">
      <div className="co-m-pane__body-section--bordered">
        <h1 className="co-section-title">Containers</h1>
        <div className="row no-gutter">
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <div className="row co-m-table-grid__head">
              <div className="col-sm-2 col-xs-4">Name</div>
              <div className="col-sm-3 hidden-xs">Id</div>
              <div className="col-sm-3 col-xs-8">Image</div>
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
    </div>

    <div className="co-m-pane__body">
      <div className="co-m-pane__body-section--bordered">
        <h1 className="co-section-title">Pod Volumes</h1>
        <div className="row no-gutter">
          <div className="co-m-table-grid co-m-table-grid--bordered">
            <div className="row co-m-table-grid__head">
              <div className="col-sm-3 col-xs-4">Name</div>
              <div className="col-sm-3 col-xs-4">Type</div>
              <div className="col-sm-3 hidden-xs">Permissions</div>
              <div className="col-sm-3 col-xs-4">Utilized By</div>
            </div>
            <div className="co-m-table-grid__body">
              {angulars.k8s.pods.getVolumeMountsByPermissions(pod).map((v, i) => <Volume key={i} pod={pod} volume={v} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
};

// TODO: Logs page and Events page are still routed to Angular code for now
const Logs = null;
const Events = null;

const kind = 'POD';

const pages = [
  {href: 'details', name: 'Overview', component: Details},
  {href: 'logs', name: 'Logs', component: Logs},
  {href: 'events', name: 'Events', component: Events},
];
const PodsDetailsPage = makeDetailsPage('PodsDetailsPage', kind, pages);

const PodList = makeList('Pods', kind, PodHeader, PodRow);
const PodsPage = makeListPage('PodsPage', kind, PodList, [], filters);

export {PodList, PodsPage, PodsDetailsPage};
