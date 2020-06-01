import * as React from 'react';
import * as _ from 'lodash-es';

import { Status } from '@console/shared';
import {
  ContainerLifecycle,
  ContainerLifecycleStage,
  ContainerPort,
  ContainerProbe,
  ContainerSpec,
  ContainerStatus,
  EnvVar,
  PodKind,
  ResourceList,
  VolumeMount,
} from '../module/k8s';
import * as k8sProbe from '../module/k8s/probe';
import { getContainerState, getContainerStatus, getPullPolicyLabel } from '../module/k8s/container';
import {
  Firehose,
  HorizontalNav,
  MsgBox,
  NodeLink,
  PageHeading,
  ResourceLink,
  ScrollToTopOnMount,
  SectionHeading,
  Timestamp,
} from './utils';
import { resourcePath } from './utils/resource-link';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';

const formatComputeResources = (resources: ResourceList) =>
  _.map(resources, (v, k) => `${k}: ${v}`).join(', ');

const getResourceRequestsValue = (container: ContainerSpec) => {
  const requests: ResourceList = _.get(container, 'resources.requests');
  return formatComputeResources(requests);
};

const getResourceLimitsValue = (container: ContainerSpec) => {
  const limits: ResourceList = _.get(container, 'resources.limits');
  return formatComputeResources(limits);
};

const Lifecycle: React.FC<LifecycleProps> = ({ lifecycle }) => {
  const fields = lifecycle && k8sProbe.mapLifecycleConfigToFields(lifecycle);
  const postStart = _.get(fields, 'postStart.cmd');
  const preStop = _.get(fields, 'preStop.cmd');

  const label = (stage: ContainerLifecycleStage) =>
    lifecycle && k8sProbe.getLifecycleHookLabel(lifecycle, stage);
  return (
    <div>
      {postStart && (
        <div>
          <span>PostStart: {label('postStart')}</span> <code>{postStart}</code>
        </div>
      )}
      {preStop && (
        <div>
          <span>PreStop: {label('preStop')}</span> <code>{preStop}</code>
        </div>
      )}
      {!postStart && !preStop && '-'}
    </div>
  );
};
Lifecycle.displayName = 'Lifecycle';

const Probe: React.FC<ProbeProps> = ({ probe, podIP }) => {
  const label = probe && k8sProbe.getActionLabelFromObject(probe);
  const value = probe && _.get(k8sProbe.mapProbeToFields(probe, podIP), 'cmd');
  if (!value) {
    return <>-</>;
  }
  const isMultiline = value.indexOf('\n') !== -1;
  const formattedValue = isMultiline ? <pre>{value}</pre> : <code>{value}</code>;
  return (
    <>
      {label} {formattedValue}
    </>
  );
};
Probe.displayName = 'Probe';

const Ports: React.FC<PortsProps> = ({ ports }) => {
  if (!ports || !ports.length) {
    return (
      <MsgBox
        className="co-sysevent-stream__status-box-empty"
        title="No ports have been exposed"
        detail="Ports allow for traffic to enter this container"
      />
    );
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Container</th>
        </tr>
      </thead>
      <tbody>
        {ports.map((p: ContainerPort, i: number) => (
          <tr key={i}>
            <td>{p.name || '-'}</td>
            <td>{p.containerPort}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const VolumeMounts: React.FC<VolumeMountProps> = ({ volumeMounts }) => {
  if (!volumeMounts || !volumeMounts.length) {
    return (
      <MsgBox
        className="co-sysevent-stream__status-box-empty"
        title="No volumes have been mounted"
        detail="Volumes allow data to be shared as files with the pod"
      />
    );
  }

  return (
    <table className="table table--layout-fixed">
      <thead>
        <tr>
          <th>Access</th>
          <th>Location</th>
          <th>Mount Path</th>
        </tr>
      </thead>
      <tbody>
        {volumeMounts.map((v: VolumeMount) => (
          <tr key={v.name}>
            <td>{v.readOnly === true ? 'Read Only' : 'Read / Write'}</td>
            <td className="co-break-all co-select-to-copy">{v.name}</td>
            <td>
              {v.mountPath ? (
                <div className="co-break-all co-select-to-copy">{v.mountPath}</div>
              ) : (
                '-'
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
VolumeMounts.displayName = 'VolumeMounts';

const Env: React.FC<EnvProps> = ({ env }) => {
  if (!env || !env.length) {
    return (
      <MsgBox
        className="co-sysevent-stream__status-box-empty"
        title="No variables have been set"
        detail="An easy way to pass configuration values"
      />
    );
  }

  const value = (e: EnvVar) => {
    const v = e.valueFrom;
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

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {env.map((e: EnvVar, i: number) => (
          <tr key={i}>
            <td>{e.name}</td>
            <td>{value(e)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
Env.displayName = 'Env';

// Split image string into the image name and tag.
const getImageNameAndTag = (image: string) => {
  if (!image) {
    return { imageName: null, imageTag: null };
  }
  const index = image.lastIndexOf(':');
  if (index === -1 || _.includes(image, '@sha256:')) {
    return { imageName: image, imageTag: null };
  }
  const imageName = image.substr(0, index);
  const imageTag = image.substr(index + 1);
  return { imageName, imageTag };
};

const ContainerDetails: React.FC<ContainerDetailsProps> = (props) => {
  const pod = props.obj;
  const container =
    (_.find(pod.spec.containers, { name: props.match.params.name }) as ContainerSpec) ||
    (_.find(pod.spec.initContainers, { name: props.match.params.name }) as ContainerSpec);
  if (!container) {
    return null;
  }

  const status: ContainerStatus =
    getContainerStatus(pod, container.name) || ({} as ContainerStatus);
  const state = getContainerState(status);
  const stateValue =
    state.value === 'terminated' && _.isFinite(state.exitCode)
      ? `${state.label} with exit code ${state.exitCode}`
      : state.label;
  const { imageName, imageTag } = getImageNameAndTag(container.image);

  return (
    <div className="co-m-pane__body">
      <ScrollToTopOnMount />

      <div className="row">
        <div className="col-lg-4">
          <SectionHeading text="Container Details" />
          <dl className="co-m-pane__details">
            <dt>State</dt>
            <dd>
              <Status status={stateValue} />
            </dd>
            <dt>ID</dt>
            <dd>
              {status.containerID ? (
                <div className="co-break-all co-select-to-copy">{status.containerID}</div>
              ) : (
                '-'
              )}
            </dd>
            <dt>Restarts</dt>
            <dd>{status.restartCount}</dd>
            <dt>Resource Requests</dt>
            <dd>{getResourceRequestsValue(container) || '-'}</dd>
            <dt>Resource Limits</dt>
            <dd>{getResourceLimitsValue(container) || '-'}</dd>
            <dt>Lifecycle Hooks</dt>
            <dd>
              <Lifecycle lifecycle={container.lifecycle} />
            </dd>
            <dt>Readiness Probe</dt>
            <dd>
              <Probe probe={container.readinessProbe} podIP={pod.status.podIP || '-'} />
            </dd>
            <dt>Liveness Probe</dt>
            <dd>
              <Probe probe={container.livenessProbe} podIP={pod.status.podIP || '-'} />
            </dd>
            <dt>Started</dt>
            <dd>
              <Timestamp timestamp={state.startedAt} />
            </dd>
            <dt>Finished</dt>
            <dd>
              <Timestamp timestamp={state.finishedAt} />
            </dd>
            <dt>Pod</dt>
            <dd>
              <ResourceLink
                kind="Pod"
                name={props.match.params.podName}
                namespace={props.match.params.ns}
              />
            </dd>
          </dl>
        </div>

        <div className="col-lg-4">
          <SectionHeading text="Image Details" />
          <dl className="co-m-pane__details">
            <dt>Image</dt>
            <dd>
              {imageName ? <div className="co-break-all co-select-to-copy">{imageName}</div> : '-'}
            </dd>
            <dt>Image Version/Tag</dt>
            <dd>{imageTag || '-'}</dd>
            <dt>Command</dt>
            <dd>
              {container.command ? (
                <pre>
                  <code>{container.command.join(' ')}</code>
                </pre>
              ) : (
                <span>-</span>
              )}
            </dd>
            <dt>Args</dt>
            <dd>
              {container.args ? (
                <pre>
                  <code>{container.args.join(' ')}</code>
                </pre>
              ) : (
                <span>-</span>
              )}
            </dd>
            <dt>Pull Policy</dt>
            <dd>{getPullPolicyLabel(container)}</dd>
          </dl>
        </div>

        <div className="col-lg-4">
          <SectionHeading text="Network" />
          <dl className="co-m-pane__details">
            <dt>Node</dt>
            <dd>
              <NodeLink name={pod.spec.nodeName} />
            </dd>
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
            <VolumeMounts volumeMounts={container.volumeMounts} />
          </div>
        </div>

        <div className="col-lg-4">
          <SectionHeading text="Environment Variables" />
          <div className="co-table-container">
            <Env env={container.env} />
          </div>
        </div>
      </div>
    </div>
  );
};
ContainerDetails.displayName = 'ContainerDetails';

export const ContainersDetailsPage: React.FC<ContainerDetailsPageProps> = (props) => (
  <div>
    <Firehose
      resources={[
        {
          name: props.match.params.podName,
          namespace: props.match.params.ns,
          kind: 'Pod',
          isList: false,
          prop: 'obj',
        },
      ]}
    >
      <PageHeading
        detail={true}
        title={props.match.params.name}
        kind="Container"
        breadcrumbsFor={() => [
          { name: 'Pods', path: getBreadcrumbPath(props.match, 'pods') },
          {
            name: props.match.params.podName,
            path: resourcePath('Pod', props.match.params.podName, props.match.params.ns),
          },
          { name: 'Container Details', path: props.match.url },
        ]}
      />
      <HorizontalNav
        hideNav={true}
        pages={[{ name: 'container', href: '', component: ContainerDetails }]}
        match={props.match}
      />
    </Firehose>
  </div>
);
ContainersDetailsPage.displayName = 'ContainersDetailsPage';

type LifecycleProps = {
  lifecycle: ContainerLifecycle;
};

type ProbeProps = {
  probe: ContainerProbe;
  podIP: string;
};

type PortsProps = {
  ports: ContainerPort[];
};

type VolumeMountProps = {
  volumeMounts: VolumeMount[];
};

type EnvProps = {
  env: EnvVar[];
};

type ContainerDetailsProps = {
  match: any;
  obj: PodKind;
};

type ContainerDetailsPageProps = {
  match: any;
};
