import * as React from 'react';
import * as _ from 'lodash-es';

import { getContainerState, getContainerStatus, getPullPolicyLabel } from '../module/k8s/docker';
import * as k8sProbe from '../module/k8s/probe';
import { SectionHeading, Firehose, Overflow, MsgBox, NavTitle, Timestamp, VertNav, ResourceLink, ScrollToTopOnMount } from './utils';

const formatComputeResources = resources => _.map(resources, (v, k) => `${k}: ${v}`).join(', ');

const getResourceRequestsValue = container => {
  const requests = _.get(container, 'resources.requests');
  return formatComputeResources(requests);
};

const getResourceLimitsValue = container => {
  const limits = _.get(container, 'resources.limits');
  return formatComputeResources(limits);
};

const Lifecycle = ({lifecycle}) => {
  const fields = lifecycle && k8sProbe.mapLifecycleConfigToFields(lifecycle);
  const postStart = _.get(fields, 'postStart.cmd');
  const preStop = _.get(fields, 'preStop.cmd');

  const label = stage => lifecycle && k8sProbe.getLifecycleHookLabel(lifecycle, stage);
  return <div>
    {postStart && <div><span>PostStart: {label('postStart')}</span> <code>{postStart}</code></div>}
    {preStop && <div><span>PreStop: {label('preStop')}</span> <code>{preStop}</code></div>}
    {!postStart && !preStop && <span>-</span>}
  </div>;
};

const Probe = ({probe, podIP}) => {
  const label = probe && k8sProbe.getActionLabelFromObject(probe);
  const value = probe && _.get(k8sProbe.mapProbeToFields(probe, podIP), 'cmd');
  if (!value) {
    return '-';
  }
  const isMultiline = value.indexOf('\n') !== -1;
  const formattedValue = isMultiline ? <pre>{value}</pre> : <code>{value}</code>;
  return <React.Fragment>{label} {formattedValue}</React.Fragment>;
};

const Ports = ({ports}) => {
  if (!ports || !ports.length) {
    return <MsgBox className="co-sysevent-stream__status-box-empty" title="No ports have been exposed" detail="Ports allow for traffic to enter this container" />;
  }

  return <table className="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Container</th>
      </tr>
    </thead>
    <tbody>
      {ports.map((p, i) => <tr key={i}>
        <td>{p.name || '-'}</td>
        <td>{p.containerPort}</td>
      </tr>)}
    </tbody>
  </table>;
};

const Volumes = ({volumes}) => {
  if (!volumes || !volumes.length) {
    return <MsgBox className="co-sysevent-stream__status-box-empty" title="No volumes have been mounted" detail="Volumes allow data to be shared as files with the pod" />;
  }

  return <table className="table">
    <thead>
      <tr>
        <th>Access</th>
        <th>Location</th>
        <th>Mount Path</th>
      </tr>
    </thead>
    <tbody>
      {volumes.map((v, i) => <tr key={i}>
        <td>{v.readOnly === true ? 'Read Only' : 'Read / Write'}</td>
        <td>{v.name}</td>
        <td><Overflow value={v.mountPath} /></td>
      </tr>)}
    </tbody>
  </table>;
};

const Env = ({env}) => {
  if (!env || !env.length) {
    return <MsgBox className="co-sysevent-stream__status-box-empty" title="No variables have been set" detail="An easy way to pass configuration values" />;
  }

  const value = (e) => {
    let v = e.valueFrom;
    if (_.has(v, 'fieldRef')) {
      return `field: ${v.fieldRef.fieldPath}`;
    } else if (_.has(v, 'resourceFieldRef')) {
      return `resource: ${v.resourceFieldRef.resource}`;
    } else if (_.has(v, 'configMapKeyRef')) {
      return `config-map: ${v.configMapKeyRef.name}/${v.configMapKeyRef.key}`;
    } else if (_.has(v, 'secretKeyRef')) {
      return `secret: ${v.secretKeyRef.name}/${v.secretKeyRef.key}`;
    }
    return e.value;
  };

  return <table className="table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {env.map((e, i) => <tr key={i}>
        <td>{e.name}</td>
        <td>{value(e)}</td>
      </tr>)}
    </tbody>
  </table>;
};

// Split image string into the image name and tag.
const getImageNameAndTag = image => {
  if (!image) {
    return {imageName: null, imageTag: null};
  }
  const index = image.lastIndexOf(':');
  if (index === -1 || _.includes(image, '@sha256:')) {
    return { imageName: image, imageTag: null };
  }
  const imageName = image.substr(0, index);
  const imageTag = image.substr(index + 1);
  return { imageName, imageTag };
};

const Details = (props) => {
  const pod = props.obj;
  const container = _.find(pod.spec.containers, {name: props.match.params.name}) ||
                  _.find(pod.spec.initContainers, {name: props.match.params.name});
  if (!container) {
    return null;
  }

  const status = getContainerStatus(pod, container.name) || {};
  const state = getContainerState(status) || {};
  const { imageName, imageTag } = getImageNameAndTag(container.image);

  return <div className="co-m-pane__body">
    <ScrollToTopOnMount />

    <div className="row">
      <div className="col-lg-4">
        <SectionHeading text="Container Overview" />
        <dl className="co-m-pane__details">
          <dt>State</dt>
          <dd>{state.label}</dd>
          <dt>ID</dt>
          <dd><Overflow value={status.containerID} /></dd>
          <dt>Restarts</dt>
          <dd>{status.restartCount}</dd>
          <dt>Resource Requests</dt>
          <dd>{getResourceRequestsValue(container) || '-'}</dd>
          <dt>Resource Limits</dt>
          <dd>{getResourceLimitsValue(container) || '-'}</dd>
          <dt>Lifecycle Hooks</dt>
          <dd><Lifecycle lifecycle={container.lifecycle} /></dd>
          <dt>Readiness Probe</dt>
          <dd><Probe probe={container.readinessProbe} podIP={pod.status.podIP || '-'} /></dd>
          <dt>Liveness Probe</dt>
          <dd><Probe probe={container.livenessProbe} podIP={pod.status.podIP || '-'} /></dd>
          <dt>Started</dt>
          <dd><Timestamp timestamp={state.startedAt} /></dd>
          <dt>Finished</dt>
          <dd><Timestamp timestamp={state.finishedAt} /></dd>
          <dt>Pod</dt>
          <dd><ResourceLink kind="Pod" name={props.match.params.podName} namespace={props.match.params.ns} /></dd>
        </dl>
      </div>

      <div className="col-lg-4">
        <SectionHeading text="Image Details" />
        <dl className="co-m-pane__details">
          <dt>Image</dt>
          <dd><Overflow value={imageName || '-'} /></dd>
          <dt>Image Version/Tag</dt>
          <dd><Overflow value={imageTag || '-'} /></dd>
          <dt>Command</dt>
          <dd>{container.command ? <pre><code>{container.command.join(' ')}</code></pre> : <span>-</span>}</dd>
          <dt>Args</dt>
          <dd>{container.args ? <pre><code>{container.args.join(' ')}</code></pre> : <span>-</span>}</dd>
          <dt>Pull Policy</dt>
          <dd>{getPullPolicyLabel(container)}</dd>
        </dl>
      </div>

      <div className="col-lg-4">
        <SectionHeading text="Network" />
        <dl className="co-m-pane__details">
          <dt>Node</dt>
          <dd><ResourceLink kind="Node" name={pod.spec.nodeName} title={pod.spec.nodeName} /></dd>
          <dt>Pod IP</dt>
          <dd>{pod.status.podIP || '-'}</dd>
        </dl>
      </div>
    </div>

    <hr />

    <div className="row">
      <div className="col-lg-4">
        <SectionHeading text="Ports" />
        <div className="co-table-container">
          <Ports ports={container.ports} />
        </div>
      </div>

      <div className="col-lg-4">
        <SectionHeading text="Mounted Volumes" />
        <div className="co-table-container">
          <Volumes volumes={container.volumeMounts} />
        </div>
      </div>

      <div className="col-lg-4">
        <SectionHeading text="Environment Variables" />
        <div className="co-table-container">
          <Env env={container.env} />
        </div>
      </div>
    </div>
  </div>;
};

export const ContainersDetailsPage = (props) => <div>
  <NavTitle
    detail={true}
    title={props.match.params.name}
    kind="Container"
    breadcrumbsFor={() => [
      {name: props.match.params.podName, path: `${props.match.url.split('/').filter((v, i) => i <= props.match.path.split('/').indexOf(':podName')).join('/')}`},
      {name: 'Container Details', path: `${props.match.url}`},
    ]} />
  <Firehose resources={[{
    name: props.match.params.podName,
    namespace: props.match.params.ns,
    kind: 'Pod',
    isList: false,
    prop: 'obj',
  }]}>
    <VertNav hideNav={true} pages={[{name: 'container', href: '', component: Details}]} match={props.match} />
  </Firehose>
</div>;
