import ActionServiceProvider from '@console/shared/src/components/actions/ActionServiceProvider';
import ActionMenu from '@console/shared/src/components/actions/menu/ActionMenu';
import { ActionMenuVariant } from '@console/shared/src/components/actions/types';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { Status } from '@console/shared/src/components/status/Status';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { usePrometheusGate } from '@console/shared/src/hooks/usePrometheusGate';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import * as _ from 'lodash';
import { FC, ReactElement } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom-v5-compat';
import {
  ContainerSpec,
  ContainerState,
  K8sResourceKindReference,
  PodKind,
  referenceForModel,
} from '../module/k8s';
import {
  getContainerRestartCount,
  getContainerState,
  getContainerStatus,
} from '../module/k8s/container';
import { getRestartPolicyLabel, podPhase } from '../module/k8s/pods';
import { Conditions } from './conditions';
import { ResourceEventStream } from './events';
import { DetailsPage } from './factory/details';
import type { PrometheusResult } from './graphs';
import { Area } from './graphs/area';
import { Stack } from './graphs/stack';
import { PodLogs } from './pod-logs';
import { AsyncComponent } from './utils/async';
import { DetailsItem } from './utils/details-item';
import { ResourceSummary, RuntimeClass } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { navFactory } from './utils/horizontal-nav';
import { ResourceIcon } from './utils/resource-icon';
import { NodeLink, ResourceLink } from './utils/resource-link';
import { ScrollToTopOnMount } from './utils/scroll-to-top-on-mount';
import {
  humanizeBinaryBytes,
  humanizeCpuCores,
  humanizeDecimalBytesPerSec,
  units,
} from './utils/units';
import { VolumesTable } from './volumes-table';

// Key translations for oauth login templates
// t('public~Log in to your account')
// t('public~Log in')
// t('public~Welcome to {{platformTitle}}')
// t('public~Log in with {{providerName}}')
// t('public~Login is required. Please try again.')
// t('public~Could not check CSRF token. Please try again.')
// t('public~Invalid login or password. Please try again.')
import { PodDisruptionBudgetField } from '@console/app/src/components/pdb/PodDisruptionBudgetField';
import { PodTraffic } from './pod-traffic';
import { PodStatus } from './pod-list';

export const ContainerLink: FC<ContainerLinkProps> = ({ pod, name }) => (
  <span className="co-resource-item co-resource-item--inline">
    <ResourceIcon kind="Container" />
    <Link to={`/k8s/ns/${pod.metadata.namespace}/pods/${pod.metadata.name}/containers/${name}`}>
      {name}
    </Link>
  </span>
);
ContainerLink.displayName = 'ContainerLink';

const ContainerRunningSince: FC<ContainerRunningSinceProps> = ({ startedAt }) => {
  const { t } = useTranslation();
  return startedAt ? (
    <Trans t={t} ns="public">
      since <Timestamp timestamp={startedAt} simple />
    </Trans>
  ) : null;
};

const ContainerTerminatedAt: FC<ContainerTerminatedAtProps> = ({ finishedAt }) => {
  const { t } = useTranslation();
  return finishedAt ? (
    <Trans t={t} ns="public">
      at <Timestamp timestamp={finishedAt} simple />{' '}
    </Trans>
  ) : null;
};

const ContainerTerminatedExitCode: FC<ContainerTerminatedExitCodeProps> = ({ exitCode }) => {
  const { t } = useTranslation();
  return exitCode ? <>{t('public~with exit code {{exitCode}} ', { exitCode })}</> : null;
};

const ContainerTerminatedReason: FC<ContainerTerminatedReasonProps> = ({ reason }) => {
  const { t } = useTranslation();
  return reason ? <>{t('public~({{reason}})', { reason })}</> : null;
};

export const ContainerLastState: FC<ContainerLastStateProps> = ({ containerLastState }) => {
  const { t } = useTranslation();
  if (containerLastState?.waiting) {
    return <>{t('public~Waiting {{reason}}', { reason: containerLastState.waiting?.reason })}</>;
  } else if (containerLastState?.running) {
    return (
      <Trans t={t} ns="public">
        Running <ContainerRunningSince startedAt={containerLastState.running?.startedAt} />
      </Trans>
    );
  } else if (containerLastState?.terminated) {
    return (
      <Trans t={t} ns="public">
        Terminated <ContainerTerminatedAt finishedAt={containerLastState.terminated?.finishedAt} />
        <ContainerTerminatedExitCode exitCode={containerLastState.terminated?.exitCode} />
        <ContainerTerminatedReason reason={containerLastState.terminated?.reason} />
      </Trans>
    );
  }
  return <>-</>;
};

export const ContainerRow: FC<ContainerRowProps> = ({ pod, container }) => {
  const { t } = useTranslation();
  const cstatus = getContainerStatus(pod, container.name);
  const cstate = getContainerState(cstatus);
  const startedAt =
    _.get(cstate, 'startedAt') ||
    _.get(cstatus, 'lastState.running.startedAt') ||
    _.get(cstatus, 'lastState.terminated.startedAt');
  const finishedAt =
    _.get(cstate, 'finishedAt') || _.get(cstatus, 'lastState.terminated.finishedAt');

  return (
    <Tr>
      <Td width={20}>
        <ContainerLink pod={pod} name={container.name} />
      </Td>
      <Td className="co-select-to-copy" modifier="truncate">
        {container.image || '-'}
      </Td>
      <Td visibility={['hidden', 'visibleOnMd']}>
        <Status status={cstate.label} />
      </Td>
      <Td visibility={['hidden', 'visibleOnMd']}>
        {cstatus?.ready ? t('public~Ready') : t('public~Not ready')}
      </Td>
      <Td visibility={['hidden', 'visibleOnXl']}>
        <ContainerLastState containerLastState={cstatus?.lastState} />
      </Td>
      <Td visibility={['hidden', 'visibleOnLg']}>{getContainerRestartCount(cstatus)}</Td>
      <Td width={10} visibility={['hidden', 'visibleOnLg']}>
        <Timestamp timestamp={startedAt} />
      </Td>
      <Td width={10} visibility={['hidden', 'visibleOnXl']}>
        <Timestamp timestamp={finishedAt} />
      </Td>
      <Td visibility={['hidden', 'visibleOnXl']}>{_.get(cstate, 'exitCode', '-')}</Td>
    </Tr>
  );
};
ContainerRow.displayName = 'ContainerRow';

export const PodContainerTable: FC<PodContainerTableProps> = ({ heading, containers, pod }) => {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading text={heading} />
      <Table gridBreakPoint="">
        <Thead>
          <Tr>
            <Th width={20}>{t('public~Name')}</Th>
            <Th>{t('public~Image')}</Th>
            <Th visibility={['hidden', 'visibleOnMd']}>{t('public~State')}</Th>
            <Th visibility={['hidden', 'visibleOnMd']}>{t('public~Ready')}</Th>
            <Th visibility={['hidden', 'visibleOnXl']}>{t('public~Last State')}</Th>
            <Th visibility={['hidden', 'visibleOnLg']}>{t('public~Restarts')}</Th>
            <Th width={10} visibility={['hidden', 'visibleOnLg']}>
              {t('public~Started')}
            </Th>
            <Th width={10} visibility={['hidden', 'visibleOnXl']}>
              {t('public~Finished')}
            </Th>
            <Th visibility={['hidden', 'visibleOnXl']}>{t('public~Exit code')}</Th>
          </Tr>
        </Thead>
        <Tbody>
          {containers.map((c: ContainerSpec, i: number) => (
            <ContainerRow key={i} pod={pod} container={c} />
          ))}
        </Tbody>
      </Table>
    </>
  );
};

const getNetworkName = (result: PrometheusResult) =>
  // eslint-disable-next-line camelcase
  result?.metric?.network_name || 'unnamed interface';

// TODO update to use QueryBrowser for each graph
const PodMetrics: FC<PodMetricsProps> = ({ obj }) => {
  const { t } = useTranslation();
  return (
    <Dashboard className="resource-metrics-dashboard">
      <Grid hasGutter>
        <GridItem xl={6} lg={12}>
          <Card className="resource-metrics-dashboard__card">
            <CardHeader>
              <CardTitle>{t('public~Memory usage')}</CardTitle>
            </CardHeader>
            <CardBody className="resource-metrics-dashboard__card-body">
              <Area
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeBinaryBytes}
                byteDataType={ByteDataTypes.BinaryBytes}
                namespace={obj.metadata.namespace}
                query={`sum(container_memory_working_set_bytes{pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}',container='',}) BY (pod, namespace)`}
                limitQuery={`sum(kube_pod_resource_limit{resource='memory',pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'})`}
                requestedQuery={`sum(kube_pod_resource_request{resource='memory',pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'}) BY (pod, namespace)`}
              />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xl={6} lg={12}>
          <Card className="resource-metrics-dashboard__card">
            <CardHeader>
              <CardTitle>{t('public~CPU usage')}</CardTitle>
            </CardHeader>
            <CardBody className="resource-metrics-dashboard__card-body">
              <Area
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeCpuCores}
                namespace={obj.metadata.namespace}
                query={`pod:container_cpu_usage:sum{pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'}`}
                limitQuery={`sum(kube_pod_resource_limit{resource='cpu',pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'})`}
                requestedQuery={`sum(kube_pod_resource_request{resource='cpu',pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'}) BY (pod, namespace)`}
              />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xl={6} lg={12}>
          <Card className="resource-metrics-dashboard__card">
            <CardHeader>
              <CardTitle>{t('public~Filesystem')}</CardTitle>
            </CardHeader>
            <CardBody className="resource-metrics-dashboard__card-body">
              <Area
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeBinaryBytes}
                byteDataType={ByteDataTypes.BinaryBytes}
                namespace={obj.metadata.namespace}
                query={`pod:container_fs_usage_bytes:sum{pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'}`}
              />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xl={6} lg={12}>
          <Card className="resource-metrics-dashboard__card">
            <CardHeader>
              <CardTitle>{t('public~Network in')}</CardTitle>
            </CardHeader>
            <CardBody className="resource-metrics-dashboard__card-body">
              <Stack
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeDecimalBytesPerSec}
                namespace={obj.metadata.namespace}
                query={`pod_interface_network:container_network_receive_bytes:irate5m{pod='${obj.metadata.name}', namespace='${obj.metadata.namespace}'}`}
                description={getNetworkName}
              />
            </CardBody>
          </Card>
        </GridItem>
        <GridItem xl={6} lg={12}>
          <Card className="resource-metrics-dashboard__card">
            <CardHeader>
              <CardTitle>{t('public~Network out')}</CardTitle>
            </CardHeader>
            <CardBody className="resource-metrics-dashboard__card-body">
              <Stack
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeDecimalBytesPerSec}
                namespace={obj.metadata.namespace}
                query={`pod_interface_network:container_network_transmit_bytes_total:irate5m{pod='${obj.metadata.name}', namespace='${obj.metadata.namespace}'}`}
                description={getNetworkName}
              />
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Dashboard>
  );
};

export const PodDetailsList: FC<PodDetailsListProps> = ({ pod }) => {
  const { t } = useTranslation();
  const moreThanOnePodIPs = pod.status?.podIPs?.length > 1;
  const moreThanOneHostIPs = pod.status?.hostIPs?.length > 1;
  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{t('public~Status')}</DescriptionListTerm>
        <DescriptionListDescription>
          <PodStatus pod={pod} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DetailsItem label={t('public~Restart policy')} obj={pod} path="spec.restartPolicy">
        {getRestartPolicyLabel(pod)}
      </DetailsItem>
      <DetailsItem
        label={t('public~Active deadline seconds')}
        obj={pod}
        path="spec.activeDeadlineSeconds"
      >
        {pod.spec.activeDeadlineSeconds
          ? t('public~{{count}} second', { count: pod.spec.activeDeadlineSeconds })
          : t('public~Not configured')}
      </DetailsItem>
      <DetailsItem
        label={moreThanOnePodIPs ? t('public~Pod IPs') : t('public~Pod IP')}
        obj={pod}
        path={moreThanOnePodIPs ? 'status.podIPs' : 'status.podIP'}
      >
        {moreThanOnePodIPs
          ? pod.status?.podIPs?.map((podIP) => podIP.ip).join(', ') || ''
          : pod.status?.podIP || ''}
      </DetailsItem>
      <DetailsItem
        label={moreThanOneHostIPs ? t('public~Host IPs') : t('public~Host IP')}
        obj={pod}
        path={moreThanOneHostIPs ? 'status.hostIPs' : 'status.hostIP'}
      >
        {moreThanOneHostIPs
          ? pod.status?.hostIPs?.map((hostIP) => hostIP.ip).join(', ') || ''
          : pod.status?.hostIP || ''}
      </DetailsItem>
      <DetailsItem label={t('public~Node')} obj={pod} path="spec.nodeName" hideEmpty>
        <NodeLink name={pod.spec.nodeName || ''} />
      </DetailsItem>
      {pod.spec.imagePullSecrets && (
        <DetailsItem label={t('public~Image pull secret')} obj={pod} path="spec.imagePullSecrets">
          {pod.spec.imagePullSecrets.map((imagePullSecret) => (
            <ResourceLink
              key={imagePullSecret.name}
              kind="Secret"
              name={imagePullSecret.name || ''}
              namespace={pod.metadata.namespace || ''}
            />
          ))}
        </DetailsItem>
      )}
      <RuntimeClass obj={pod} path="spec.runtimeClassName" />
      <PodDisruptionBudgetField obj={pod} />
      <DetailsItem label={t('public~Receiving Traffic')} obj={pod}>
        <PodTraffic podName={pod.metadata.name || ''} namespace={pod.metadata.namespace || ''} />
      </DetailsItem>
    </DescriptionList>
  );
};
PodDetailsList.displayName = 'PodDetailsList';

export const PodResourceSummary: FC<PodResourceSummaryProps> = ({ pod }) => (
  <ResourceSummary
    resource={pod}
    showNodeSelector
    nodeSelector="spec.nodeSelector"
    showTolerations
  />
);

const Details: FC<PodDetailsProps> = ({ obj: pod }) => {
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
  const { t } = useTranslation();
  return (
    <>
      <ScrollToTopOnMount />
      <PaneBody>
        <SectionHeading text={t('public~Pod details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <PodResourceSummary pod={pod} />
          </GridItem>
          <GridItem sm={6}>
            <PodDetailsList pod={pod} />
          </GridItem>
        </Grid>
      </PaneBody>
      {pod.spec.initContainers && (
        <PaneBody>
          <PodContainerTable
            key="initContainerTable"
            heading={t('public~Init containers')}
            containers={pod.spec.initContainers}
            pod={pod}
          />
        </PaneBody>
      )}
      <PaneBody>
        <PodContainerTable
          key="containerTable"
          heading={t('public~Containers')}
          containers={pod.spec.containers}
          pod={pod}
        />
      </PaneBody>
      <PaneBody>
        <VolumesTable resource={pod} heading={t('public~Volumes')} />
      </PaneBody>
      <PaneBody>
        <SectionHeading text={t('public~Conditions')} />
        <Conditions conditions={pod.status?.conditions || []} />
      </PaneBody>
    </>
  );
};

const EnvironmentPage = (props: {
  obj: PodKind;
  rawEnvData?: any;
  envPath: string[];
  readOnly: boolean;
}) => (
  <AsyncComponent
    loader={() => import('./environment').then((c) => c.EnvironmentPage)}
    {...(props as Record<string, unknown>)}
  />
);

const envPath = ['spec', 'containers'];
const PodEnvironmentComponent = (props: { obj: PodKind }) => (
  <EnvironmentPage obj={props.obj} rawEnvData={props.obj.spec} envPath={envPath} readOnly={true} />
);

export const PodConnectLoader: FC<PodConnectLoaderProps> = ({
  obj,
  message,
  initialContainer,
  infoMessage,
  attach = false,
}) => (
  <PaneBody>
    <Grid>
      <GridItem>
        <div className="panel-body">
          <AsyncComponent
            loader={() => import('./pod-connect').then((c) => c.PodConnect)}
            obj={obj}
            message={message}
            infoMessage={infoMessage}
            initialContainer={initialContainer}
            attach={attach}
          />
        </div>
      </GridItem>
    </Grid>
  </PaneBody>
);
export const PodsDetailsPage: FC<PodDetailsPageProps> = (props) => {
  const prometheusIsAvailable = usePrometheusGate();
  const customActionMenu = (kindObj, obj) => {
    const resourceKind = referenceForModel(kindObj);
    const context = { [resourceKind]: obj };
    return (
      <ActionServiceProvider context={context}>
        {({ actions, options, loaded }) =>
          loaded && (
            <ActionMenu actions={actions} options={options} variant={ActionMenuVariant.DROPDOWN} />
          )
        }
      </ActionServiceProvider>
    );
  };
  return (
    <DetailsPage
      {...props}
      getResourceStatus={podPhase}
      customActionMenu={customActionMenu}
      pages={[
        navFactory.details(Details),
        ...(prometheusIsAvailable ? [navFactory.metrics(PodMetrics)] : []),
        navFactory.editYaml(),
        navFactory.envEditor(PodEnvironmentComponent),
        navFactory.logs(PodLogs),
        navFactory.events(ResourceEventStream),
        navFactory.terminal(PodConnectLoader),
      ]}
    />
  );
};
PodsDetailsPage.displayName = 'PodsDetailsPage';

type ContainerLinkProps = {
  pod: PodKind;
  name: string;
};

type ContainerRunningSinceProps = {
  startedAt?: string;
};

type ContainerTerminatedAtProps = {
  finishedAt?: string;
};

type ContainerTerminatedExitCodeProps = {
  exitCode?: string;
};

type ContainerTerminatedReasonProps = {
  reason?: string;
};

type ContainerLastStateProps = {
  containerLastState?: ContainerState;
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

type PodMetricsProps = {
  obj: PodKind;
};

export type PodStatusProps = {
  pod: PodKind;
};

type PodResourceSummaryProps = {
  pod: PodKind;
};

export type PodDetailsListProps = {
  pod: PodKind;
};

type PodConnectLoaderProps = {
  obj: PodKind;
  message?: ReactElement;
  infoMessage?: ReactElement;
  initialContainer?: string;
  attach?: boolean;
};

type PodDetailsProps = {
  obj: PodKind;
};

type PodDetailsPageProps = {
  kind: K8sResourceKindReference;
};
