/* eslint-disable @typescript-eslint/no-use-before-define */
import type { FC } from 'react';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import {
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { Status } from '@console/shared/src/components/status/Status';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  ContainerLifecycle,
  ContainerLifecycleStage,
  ContainerPort,
  ContainerProbe,
  ContainerSpec,
  ContainerStatus,
  EnvVar,
  PodKind,
  referenceForModel,
  ResourceList,
  VolumeMount,
} from '../module/k8s';
import { PodModel } from '../models';
import * as k8sProbe from '../module/k8s/probe';
import {
  getContainerRestartCount,
  getContainerState,
  getContainerStatus,
  getPullPolicyLabel,
} from '../module/k8s/container';
import { Firehose } from './utils/firehose';
import { HorizontalNav } from './utils/horizontal-nav';
import { ConsoleEmptyState, LoadingBox } from './utils/status-box';
import { NodeLink, resourcePath, ResourceLink } from './utils/resource-link';
import { ConnectedPageHeading, SectionHeading } from './utils/headings';
import { ScrollToTopOnMount } from './utils/scroll-to-top-on-mount';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import i18n from 'i18next';
import { ErrorPage404 } from './error';
import { ContainerLastState } from './pod';

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

const Lifecycle: FC<LifecycleProps> = ({ lifecycle }) => {
  const { t } = useTranslation();
  const fields = lifecycle && k8sProbe.mapLifecycleConfigToFields(lifecycle);
  const postStart = _.get(fields, 'postStart.cmd');
  const preStop = _.get(fields, 'preStop.cmd');

  const label = (stage: ContainerLifecycleStage) =>
    lifecycle && k8sProbe.getLifecycleHookLabel(lifecycle, stage);
  const postStartLabel = label('postStart');
  const preStopLabel = label('preStop');
  return (
    <div>
      {postStart && (
        <div>
          <Trans t={t} ns="public">
            PostStart: {{ postStartLabel }} <code className="co-code">{{ postStart }}</code>
          </Trans>
        </div>
      )}
      {preStop && (
        <div>
          <Trans t={t} ns="public">
            PreStop: {{ preStopLabel }} <code className="co-code">{{ preStop }}</code>
          </Trans>
        </div>
      )}
      {!postStart && !preStop && '-'}
    </div>
  );
};
Lifecycle.displayName = 'Lifecycle';

const Probe: FC<ProbeProps> = ({ probe, podIP }) => {
  const label = probe && k8sProbe.getActionLabelFromObject(probe);
  const value = probe && _.get(k8sProbe.mapProbeToFields(probe, podIP), 'cmd');
  if (!value) {
    return <>-</>;
  }
  const isMultiline = value.indexOf('\n') !== -1;
  const formattedValue = isMultiline ? (
    <pre className="co-pre">{value}</pre>
  ) : (
    <code className="co-code">{value}</code>
  );
  return (
    <>
      {label} {formattedValue}
    </>
  );
};
Probe.displayName = 'Probe';

const Ports: FC<PortsProps> = ({ ports }) => {
  const { t } = useTranslation();
  if (!ports || !ports.length) {
    return (
      <ConsoleEmptyState title={t('public~No ports have been exposed')}>
        {t('public~Ports allow for traffic to enter this container')}
      </ConsoleEmptyState>
    );
  }

  return (
    <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
      <thead className="pf-v6-c-table__thead">
        <tr className="pf-v6-c-table__tr">
          <th className="pf-v6-c-table__th">{t('public~Name')}</th>
          <th className="pf-v6-c-table__th">{t('public~Container')}</th>
        </tr>
      </thead>
      <tbody>
        {ports.map((p: ContainerPort, i: number) => (
          <tr className="pf-v6-c-table__tr" key={i}>
            <td className="pf-v6-c-table__td">{p.name || '-'}</td>
            <td className="pf-v6-c-table__td">{p.containerPort}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const VolumeMounts: FC<VolumeMountProps> = ({ volumeMounts }) => {
  const { t } = useTranslation();
  if (!volumeMounts || !volumeMounts.length) {
    return (
      <ConsoleEmptyState title={t('public~No volumes have been mounted')}>
        {t('public~Volumes allow data to be shared as files with the pod')}
      </ConsoleEmptyState>
    );
  }

  return (
    <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
      <thead className="pf-v6-c-table__thead">
        <tr className="pf-v6-c-table__tr">
          <th className="pf-v6-c-table__th">{t('public~Access')}</th>
          <th className="pf-v6-c-table__th">{t('public~Location')}</th>
          <th className="pf-v6-c-table__th">{t('public~Mount path')}</th>
        </tr>
      </thead>
      <tbody>
        {volumeMounts.map((v: VolumeMount) => (
          <tr className="pf-v6-c-table__tr" key={v.name}>
            <td className="pf-v6-c-table__td">
              {v.readOnly === true ? t('public~Read only') : t('public~Read/write')}
            </td>
            <td className="pf-v6-c-table__td pf-m-break-word co-select-to-copy">{v.name}</td>
            <td className="pf-v6-c-table__td">
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

const Env: FC<EnvProps> = ({ env }) => {
  const { t } = useTranslation();
  if (!env || !env.length) {
    return (
      <ConsoleEmptyState title={t('public~No variables have been set')}>
        {t('public~An easy way to pass configuration values')}
      </ConsoleEmptyState>
    );
  }

  const value = (e: EnvVar) => {
    const v = e.valueFrom;
    if (_.has(v, 'fieldRef')) {
      return t('public~field: {{fieldPath}}', v.fieldRef);
    } else if (_.has(v, 'resourceFieldRef')) {
      return t('public~resource: {{resource}}', v.resourceFieldRef);
    } else if (_.has(v, 'configMapKeyRef')) {
      return t('public~config-map: {{name}}/{{key}}', v.configMapKeyRef);
    } else if (_.has(v, 'secretKeyRef')) {
      return t('public~secret: {{name}}/{{key}}', v.secretKeyRef);
    }
    return e.value;
  };

  return (
    <table className="pf-v6-c-table pf-m-compact pf-m-border-rows">
      <thead className="pf-v6-c-table__thead">
        <tr className="pf-v6-c-table__tr">
          <th className="pf-v6-c-table__th">{t('public~Name')}</th>
          <th className="pf-v6-c-table__th">{t('public~Value')}</th>
        </tr>
      </thead>
      <tbody className="pf-v6-c-table__tbody">
        {env.map((e: EnvVar, i: number) => (
          <tr className="pf-v6-c-table__tr" key={i}>
            <td className="pf-v6-c-table__td">{e.name}</td>
            <td className="pf-v6-c-table__td">{value(e)}</td>
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

const getContainer = (pod: PodKind, name: String): ContainerSpec => {
  if (!pod.spec) {
    return null;
  }

  return _.find(pod.spec.containers, { name }) || _.find(pod.spec.initContainers, { name });
};

const getContainerStateValue = (state: any) => {
  const containerTerminated = state.value === 'terminated' && _.isFinite(state.exitCode);
  return containerTerminated
    ? i18n.t('public~{{label}} with exit code {{exitCode}}', {
        label: state.label,
        exitCode: state.exitCode,
      })
    : state.label;
};

export const ContainerDetailsList: FC<ContainerDetailsListProps> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const pod = props.obj;
  const container = getContainer(pod, params.name);

  if (!container) {
    return <ErrorPage404 />;
  }

  const status: ContainerStatus = getContainerStatus(pod, container.name);
  const state = getContainerState(status);
  const stateValue = getContainerStateValue(state);
  const { imageName, imageTag } = getImageNameAndTag(container.image);

  return (
    <PaneBody>
      <ScrollToTopOnMount />

      <Grid hasGutter>
        <GridItem lg={4}>
          <SectionHeading text={t('public~Container details')} />
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~State')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Status status={stateValue} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Last State')}</DescriptionListTerm>
              <DescriptionListDescription>
                <ContainerLastState containerLastState={status?.lastState} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~ID')}</DescriptionListTerm>
              <DescriptionListDescription>
                {status?.containerID ? (
                  <div className="co-break-all co-select-to-copy">{status.containerID}</div>
                ) : (
                  '-'
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Restarts')}</DescriptionListTerm>
              <DescriptionListDescription>
                {getContainerRestartCount(status)}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Resource requests')}</DescriptionListTerm>
              <DescriptionListDescription>
                {getResourceRequestsValue(container) || '-'}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Resource limits')}</DescriptionListTerm>
              <DescriptionListDescription>
                {getResourceLimitsValue(container) || '-'}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Lifecycle hooks')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Lifecycle lifecycle={container.lifecycle} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Readiness probe')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Probe probe={container.readinessProbe} podIP={pod.status.podIP || '-'} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Liveness probe')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Probe probe={container.livenessProbe} podIP={pod.status.podIP || '-'} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Started')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={state.startedAt} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Finished')}</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={state.finishedAt} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Pod')}</DescriptionListTerm>
              <DescriptionListDescription>
                <ResourceLink kind="Pod" name={params.podName} namespace={params.ns} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>

        <GridItem lg={4}>
          <SectionHeading text={t('public~Image details')} />
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Image')}</DescriptionListTerm>
              <DescriptionListDescription>
                {imageName ? (
                  <div className="co-break-all co-select-to-copy">{imageName}</div>
                ) : (
                  '-'
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Image version/tag')}</DescriptionListTerm>
              <DescriptionListDescription>{imageTag || '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Command')}</DescriptionListTerm>
              <DescriptionListDescription>
                {container.command ? (
                  <CodeBlock className="co-code-block--no-header">
                    <CodeBlockCode>{container.command.join(' ')}</CodeBlockCode>
                  </CodeBlock>
                ) : (
                  <span>-</span>
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Args')}</DescriptionListTerm>
              <DescriptionListDescription>
                {container.args ? (
                  <CodeBlock>
                    <CodeBlockCode>{container.args.join(' ')}</CodeBlockCode>
                  </CodeBlock>
                ) : (
                  <span>-</span>
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Pull policy')}</DescriptionListTerm>
              <DescriptionListDescription>
                {getPullPolicyLabel(container)}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>

        <GridItem lg={4}>
          <SectionHeading text={t('public~Network')} />
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Node')}</DescriptionListTerm>
              <DescriptionListDescription>
                <NodeLink name={pod.spec.nodeName} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>{t('public~Pod IP')}</DescriptionListTerm>
              <DescriptionListDescription>{pod.status.podIP || '-'}</DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>

        <GridItem>
          <Divider className="co-divider" />
        </GridItem>

        <GridItem lg={4}>
          <SectionHeading text={t('public~Ports')} />
          <div className="co-table-container">
            <Ports ports={container.ports} />
          </div>
        </GridItem>

        <GridItem lg={4}>
          <SectionHeading text={t('public~Mounted volumes')} />
          <div className="co-table-container">
            <VolumeMounts volumeMounts={container.volumeMounts} />
          </div>
        </GridItem>

        <GridItem lg={4}>
          <SectionHeading text={t('public~Environment variables')} />
          <div className="co-table-container">
            <Env env={container.env} />
          </div>
        </GridItem>
      </Grid>
    </PaneBody>
  );
};
ContainerDetailsList.displayName = 'ContainerDetailsList';

export const ContainersDetailsPage: FC = (props) => {
  const params = useParams();
  return (
    <Firehose
      resources={[
        {
          name: params.podName,
          namespace: params.ns,
          kind: 'Pod',
          isList: false,
          prop: 'obj',
        },
      ]}
    >
      <ContainerDetails {...props} />
    </Firehose>
  );
};
ContainersDetailsPage.displayName = 'ContainersDetailsPage';

const getContainerStatusStateValue = (pod: PodKind, containerName: string) => {
  const status: ContainerStatus = getContainerStatus(pod, containerName);
  const state = getContainerState(status);

  return getContainerStateValue(state);
};

export const ContainerDetails: FC<ContainerDetailsProps> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();

  if (!props.loaded) {
    return <LoadingBox />;
  }

  const pod = props.obj.data;
  const container = getContainer(pod, params.name);

  if (!container) {
    return <ErrorPage404 />;
  }

  const containerStateValue = getContainerStatusStateValue(pod, container.name);

  return (
    <>
      <ConnectedPageHeading
        title={params.name}
        kind="Container"
        getResourceStatus={() => containerStateValue}
        breadcrumbsFor={() => [
          { name: t('public~Pods'), path: getBreadcrumbPath(params, referenceForModel(PodModel)) },
          {
            name: params.podName,
            path: resourcePath('Pod', params.podName, params.ns),
          },
          { name: t('public~Container details'), path: location.pathname },
        ]}
        obj={props.obj}
      />
      <HorizontalNav
        hideNav={true}
        pages={[{ name: 'container', href: '', component: ContainerDetailsList }]}
        obj={props.obj}
      />
    </>
  );
};
ContainerDetails.displayName = 'ContainerDetails';

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

export type ContainerDetailsListProps = {
  obj: PodKind;
};

export type ContainerDetailsProps = {
  obj?: any;
  loaded?: boolean;
};
