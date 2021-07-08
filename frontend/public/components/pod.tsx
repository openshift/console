import * as React from 'react';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { Button, Popover, Grid, GridItem } from '@patternfly/react-core';
import { Status, TableColumnsType } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  withUserSettingsCompatibility,
  WithUserSettingsCompatibilityProps,
} from '@console/shared/src/hoc/withUserSettingsCompatibility';
import {
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants/common';
import * as UIActions from '../actions/ui';
import { coFetchJSON } from '../co-fetch';
import { ContainerSpec, K8sResourceKindReference, PodKind, referenceForModel } from '../module/k8s';
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
  units,
  LabelList,
  RuntimeClass,
} from './utils';
import { PodLogs } from './pod-logs';
import {
  Area,
  Stack,
  PROMETHEUS_BASE_PATH,
  PROMETHEUS_TENANCY_BASE_PATH,
  requirePrometheus,
  PrometheusResult,
} from './graphs';
import { VolumesTable } from './volumes-table';
import { PodModel } from '../models';
import { Conditions } from './conditions';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';

// Key translations for oauth login templates
// t('public~Log in to your account')
// t('public~Log in')
// t('public~Welcome to {{platformTitle}}')
// t('public~Log in with {{providerName}}')
// t('public~Login is required. Please try again.')
// t('public~Could not check CSRF token. Please try again.')
// t('public~Invalid login or password. Please try again.')

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

// t('public~Name')
// t('public~Namespace')
// t('public~Status')
// t('public~Ready')
// t('public~Restarts')
// t('public~Owner')
// t('public~Node')
// t('public~Memory')
// t('public~CPU')
// t('public~Created')
// t('public~Labels')
// t('public~IP address')

const podColumnInfo = Object.freeze({
  name: {
    classes: '',
    id: 'name',
    title: 'public~Name',
  },
  namespace: {
    classes: '',
    id: 'namespace',
    title: 'public~Namespace',
  },
  status: {
    classes: '',
    id: 'status',
    title: 'public~Status',
  },
  ready: {
    classes: classNames('pf-m-nowrap', 'pf-u-w-10-on-lg', 'pf-u-w-8-on-xl'),
    id: 'ready',
    title: 'public~Ready',
  },
  restarts: {
    classes: classNames('pf-m-nowrap', 'pf-u-w-8-on-2xl'),
    id: 'restarts',
    title: 'public~Restarts',
  },
  owner: {
    classes: '',
    id: 'owner',
    title: 'public~Owner',
  },
  node: {
    classes: '',
    id: 'node',
    title: 'public~Node',
  },
  memory: {
    classes: classNames({ 'pf-u-w-10-on-2xl': showMetrics }),
    id: 'memory',
    title: 'public~Memory',
  },
  cpu: {
    classes: classNames({ 'pf-u-w-10-on-2xl': showMetrics }),
    id: 'cpu',
    title: 'public~CPU',
  },
  created: {
    classes: classNames('pf-u-w-10-on-2xl'),
    id: 'created',
    title: 'public~Created',
  },
  labels: {
    classes: '',
    id: 'labels',
    title: 'public~Labels',
  },
  ipaddress: {
    classes: '',
    id: 'ipaddress',
    title: 'public~IP address',
  },
});

const kind = 'Pod';
const columnManagementID = referenceForModel(PodModel);

const podRowStateToProps = ({ UI }) => ({
  metrics: UI.getIn(['metrics', 'pod']),
});

const getHeader = (showNodes) => {
  return () => {
    return [
      {
        title: i18next.t(podColumnInfo.name.title),
        id: podColumnInfo.name.id,
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: podColumnInfo.name.classes },
      },
      {
        title: i18next.t(podColumnInfo.namespace.title),
        id: podColumnInfo.namespace.id,
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: podColumnInfo.namespace.classes },
      },
      {
        title: i18next.t(podColumnInfo.status.title),
        id: podColumnInfo.status.id,
        sortFunc: 'podPhase',
        transforms: [sortable],
        props: { className: podColumnInfo.status.classes },
      },
      {
        title: i18next.t(podColumnInfo.ready.title),
        id: podColumnInfo.ready.id,
        sortFunc: 'podReadiness',
        transforms: [sortable],
        props: { className: podColumnInfo.ready.classes },
      },
      {
        title: i18next.t(podColumnInfo.restarts.title),
        id: podColumnInfo.restarts.id,
        sortFunc: 'podRestarts',
        transforms: [sortable],
        props: { className: podColumnInfo.restarts.classes },
      },
      {
        title: showNodes
          ? i18next.t(podColumnInfo.node.title)
          : i18next.t(podColumnInfo.owner.title),
        id: podColumnInfo.owner.id,
        sortField: showNodes ? 'spec.nodeName' : 'metadata.ownerReferences[0].name',
        transforms: [sortable],
        props: { className: podColumnInfo.owner.classes },
      },
      {
        title: i18next.t(podColumnInfo.memory.title),
        id: podColumnInfo.memory.id,
        sortFunc: 'podMemory',
        transforms: [sortable],
        props: { className: podColumnInfo.memory.classes },
      },
      {
        title: i18next.t(podColumnInfo.cpu.title),
        id: podColumnInfo.cpu.id,
        sortFunc: 'podCPU',
        transforms: [sortable],
        props: { className: podColumnInfo.cpu.classes },
      },
      {
        title: i18next.t(podColumnInfo.created.title),
        id: podColumnInfo.created.id,
        sortField: 'metadata.creationTimestamp',
        transforms: [sortable],
        props: { className: podColumnInfo.created.classes },
      },
      {
        title: i18next.t(podColumnInfo.node.title),
        id: podColumnInfo.node.id,
        sortField: 'spec.nodeName',
        transforms: [sortable],
        props: { className: podColumnInfo.node.classes },
        additional: true,
      },
      {
        title: i18next.t(podColumnInfo.labels.title),
        id: podColumnInfo.labels.id,
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: podColumnInfo.labels.classes },
        additional: true,
      },
      {
        title: i18next.t(podColumnInfo.ipaddress.title),
        id: podColumnInfo.ipaddress.id,
        sortField: 'status.podIP',
        transforms: [sortable],
        props: { className: podColumnInfo.ipaddress.classes },
        additional: true,
      },
      {
        title: '',
        props: { className: Kebab.columnClass },
      },
    ];
  };
};

const getSelectedColumns = (showNodes: boolean) => {
  return new Set(
    getHeader(showNodes)().reduce((acc, column) => {
      if (column.id && !column.additional) {
        acc.push(column.id);
      }
      return acc;
    }, []),
  );
};

const PodTableRow = connect<PodTableRowPropsFromState, null, PodTableRowProps>(podRowStateToProps)(
  ({
    obj: pod,
    index,
    rowKey,
    style,
    metrics,
    showNodes,
    showNamespaceOverride,
    tableColumns,
  }: PodTableRowProps & PodTableRowPropsFromState) => {
    const { name, namespace, creationTimestamp, labels } = pod.metadata;
    const { readyCount, totalContainers } = podReadiness(pod);
    const phase = podPhase(pod);
    const restarts = podRestarts(pod);
    const bytes: number = _.get(metrics, ['memory', namespace, name]);
    const cores: number = _.get(metrics, ['cpu', namespace, name]);
    const columns: Set<string> =
      tableColumns?.length > 0 ? new Set(tableColumns) : getSelectedColumns(showNodes);
    const { t } = useTranslation();
    return (
      <TableRow id={pod.metadata.uid} index={index} trKey={rowKey} style={style}>
        <TableData className={podColumnInfo.name.classes}>
          <ResourceLink kind={kind} name={name} namespace={namespace} />
        </TableData>
        <TableData
          className={classNames(podColumnInfo.namespace.classes, 'co-break-word')}
          columns={columns}
          columnID={podColumnInfo.namespace.id}
          showNamespaceOverride={showNamespaceOverride}
        >
          <ResourceLink kind="Namespace" name={namespace} />
        </TableData>
        <TableData
          className={podColumnInfo.status.classes}
          columns={columns}
          columnID={podColumnInfo.status.id}
        >
          <PodStatus pod={pod} />
        </TableData>
        <TableData
          className={podColumnInfo.ready.classes}
          columns={columns}
          columnID={podColumnInfo.ready.id}
        >
          {readyCount}/{totalContainers}
        </TableData>
        <TableData
          className={podColumnInfo.restarts.classes}
          columns={columns}
          columnID={podColumnInfo.restarts.id}
        >
          {restarts}
        </TableData>
        <TableData
          className={podColumnInfo.owner.classes}
          columns={columns}
          columnID={podColumnInfo.owner.id}
        >
          {showNodes ? (
            <ResourceLink kind="Node" name={pod.spec.nodeName} namespace={namespace} />
          ) : (
            <OwnerReferences resource={pod} />
          )}
        </TableData>
        <TableData
          className={podColumnInfo.memory.classes}
          columns={columns}
          columnID={podColumnInfo.memory.id}
        >
          {bytes ? `${formatBytesAsMiB(bytes)} MiB` : '-'}
        </TableData>
        <TableData
          className={podColumnInfo.cpu.classes}
          columns={columns}
          columnID={podColumnInfo.cpu.id}
        >
          {cores ? t('public~{{numCores}} cores', { numCores: formatCores(cores) }) : '-'}
        </TableData>
        <TableData
          className={podColumnInfo.created.classes}
          columns={columns}
          columnID={podColumnInfo.created.id}
        >
          <Timestamp timestamp={creationTimestamp} />
        </TableData>
        <TableData
          className={podColumnInfo.node.classes}
          columns={columns}
          columnID={podColumnInfo.node.id}
        >
          <ResourceLink kind="Node" name={pod.spec.nodeName} namespace={namespace} />
        </TableData>
        <TableData
          className={podColumnInfo.labels.classes}
          columns={columns}
          columnID={podColumnInfo.labels.id}
        >
          <LabelList kind={kind} labels={labels} />
        </TableData>
        <TableData
          className={podColumnInfo.ipaddress.classes}
          columns={columns}
          columnID={podColumnInfo.ipaddress.id}
        >
          {pod?.status?.podIP ?? '-'}
        </TableData>
        <TableData className={Kebab.columnClass}>
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
}) => {
  const { t } = useTranslation();
  return (
    <>
      <SectionHeading text={heading} />
      <div className="co-m-table-grid co-m-table-grid--bordered">
        <div className="row co-m-table-grid__head">
          <div className="col-lg-2 col-md-3 col-sm-4 col-xs-5">{t('public~Name')}</div>
          <div className="col-lg-2 col-md-3 col-sm-5 col-xs-7">{t('public~Image')}</div>
          <div className="col-lg-2 col-md-2 col-sm-3 hidden-xs">{t('public~State')}</div>
          <div className="col-lg-1 col-md-2 hidden-sm hidden-xs">{t('public~Restarts')}</div>
          <div className="col-lg-2 col-md-2 hidden-sm hidden-xs">{t('public~Started')}</div>
          <div className="col-lg-2 hidden-md hidden-sm hidden-xs">{t('public~Finished')}</div>
          <div className="col-lg-1 hidden-md hidden-sm hidden-xs">{t('public~Exit code')}</div>
        </div>
        <div className="co-m-table-grid__body">
          {containers.map((c: any, i: number) => (
            <ContainerRow key={i} pod={pod} container={c} />
          ))}
        </div>
      </div>
    </>
  );
};

const getNetworkName = (result: PrometheusResult) =>
  // eslint-disable-next-line camelcase
  result?.metric?.network_name || 'unnamed interface';

// TODO update to use QueryBrowser for each graph
const PodMetrics = requirePrometheus(({ obj }) => {
  const { t } = useTranslation();
  return (
    <Dashboard>
      <Grid hasGutter>
        <GridItem xl={6} lg={12}>
          <DashboardCard>
            <DashboardCardHeader>
              <DashboardCardTitle>{t('public~Memory usage')}</DashboardCardTitle>
            </DashboardCardHeader>
            <DashboardCardBody>
              <Area
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeBinaryBytes}
                byteDataType={ByteDataTypes.BinaryBytes}
                namespace={obj.metadata.namespace}
                query={`sum(container_memory_working_set_bytes{pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}',container='',}) BY (pod, namespace)`}
                limitQuery={`sum(kube_pod_resource_limit{resource='memory',pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'})`}
                requestedQuery={`sum(kube_pod_resource_request{resource='memory',pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'}) BY (pod, namespace)`}
              />
            </DashboardCardBody>
          </DashboardCard>
        </GridItem>
        <GridItem xl={6} lg={12}>
          <DashboardCard>
            <DashboardCardHeader>
              <DashboardCardTitle>{t('public~CPU usage')}</DashboardCardTitle>
            </DashboardCardHeader>
            <DashboardCardBody>
              <Area
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeCpuCores}
                namespace={obj.metadata.namespace}
                query={`pod:container_cpu_usage:sum{pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'}`}
                limitQuery={`sum(kube_pod_resource_limit{resource='cpu',pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'})`}
                requestedQuery={`sum(kube_pod_resource_request{resource='cpu',pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'}) BY (pod, namespace)`}
              />
            </DashboardCardBody>
          </DashboardCard>
        </GridItem>
        <GridItem xl={6} lg={12}>
          <DashboardCard>
            <DashboardCardHeader>
              <DashboardCardTitle>{t('public~Filesystem')}</DashboardCardTitle>
            </DashboardCardHeader>
            <DashboardCardBody>
              <Area
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeBinaryBytes}
                byteDataType={ByteDataTypes.BinaryBytes}
                namespace={obj.metadata.namespace}
                query={`pod:container_fs_usage_bytes:sum{pod='${obj.metadata.name}',namespace='${obj.metadata.namespace}'}`}
              />
            </DashboardCardBody>
          </DashboardCard>
        </GridItem>
        <GridItem xl={6} lg={12}>
          <DashboardCard>
            <DashboardCardHeader>
              <DashboardCardTitle>{t('public~Network in')}</DashboardCardTitle>
            </DashboardCardHeader>
            <DashboardCardBody>
              <Stack
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeDecimalBytesPerSec}
                namespace={obj.metadata.namespace}
                query={`(sum(irate(container_network_receive_bytes_total{pod='${obj.metadata.name}', namespace='${obj.metadata.namespace}'}[5m])) by (pod, namespace, interface)) + on(namespace,pod,interface) group_left(network_name) ( pod_network_name_info )`}
                description={getNetworkName}
              />
            </DashboardCardBody>
          </DashboardCard>
        </GridItem>
        <GridItem xl={6} lg={12}>
          <DashboardCard>
            <DashboardCardHeader>
              <DashboardCardTitle>{t('public~Network out')}</DashboardCardTitle>
            </DashboardCardHeader>
            <DashboardCardBody>
              <Stack
                ariaChartLinkLabel={t('public~View in query browser')}
                humanize={humanizeDecimalBytesPerSec}
                namespace={obj.metadata.namespace}
                query={`(sum(irate(container_network_transmit_bytes_total{pod='${obj.metadata.name}', namespace='${obj.metadata.namespace}'}[5m])) by (pod, namespace, interface)) + on(namespace,pod,interface) group_left(network_name) ( pod_network_name_info )`}
                description={getNetworkName}
              />
            </DashboardCardBody>
          </DashboardCard>
        </GridItem>
      </Grid>
    </Dashboard>
  );
});

const PodStatusPopover: React.FC<PodStatusPopoverProps> = ({
  bodyContent,
  headerContent,
  status,
}) => {
  return (
    <Popover headerContent={headerContent} bodyContent={bodyContent}>
      <Button variant="link" isInline>
        <Status status={status} />
      </Button>
    </Popover>
  );
};

export const PodStatus: React.FC<PodStatusProps> = ({ pod }) => {
  const status = podPhase(pod);
  const unschedulableCondition = pod.status?.conditions?.find(
    (condition) => condition.reason === 'Unschedulable' && condition.status === 'False',
  );
  const containerStatusStateWaiting = pod.status?.containerStatuses?.find(
    (cs) => cs.state?.waiting,
  );
  const { t } = useTranslation();

  if (status === 'Pending' && unschedulableCondition) {
    return (
      <PodStatusPopover
        bodyContent={unschedulableCondition.message}
        headerContent={t('public~Pod unschedulable')}
        status={status}
      />
    );
  }
  if (
    (status === 'CrashLoopBackOff' || status === 'ErrImagePull' || status === 'ImagePullBackOff') &&
    containerStatusStateWaiting
  ) {
    return (
      <PodStatusPopover
        bodyContent={containerStatusStateWaiting.state.waiting.message}
        status={status}
      />
    );
  }

  return <Status status={status} />;
};

export const PodDetailsList: React.FC<PodDetailsListProps> = ({ pod }) => {
  const { t } = useTranslation();
  return (
    <dl className="co-m-pane__details">
      <dt>{t('public~Status')}</dt>
      <dd>
        <PodStatus pod={pod} />
      </dd>
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
      <DetailsItem label={t('public~Pod IP')} obj={pod} path="status.podIP" />
      <DetailsItem label={t('public~Node')} obj={pod} path="spec.nodeName" hideEmpty>
        <NodeLink name={pod.spec.nodeName} />
      </DetailsItem>
      <RuntimeClass obj={pod} path="spec.runtimeClassName" />
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
  const { t } = useTranslation();
  return (
    <>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Pod details')} />
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
            heading={t('public~Init containers')}
            containers={pod.spec.initContainers}
            pod={pod}
          />
        </div>
      )}
      <div className="co-m-pane__body">
        <PodContainerTable
          key="containerTable"
          heading={t('public~Containers')}
          containers={pod.spec.containers}
          pod={pod}
        />
      </div>
      <div className="co-m-pane__body">
        <VolumesTable resource={pod} heading={t('public~Volumes')} />
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text={t('public~Conditions')} />
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

export const PodsDetailsPage: React.FC<PodDetailsPageProps> = (props) => {
  // t('public~Terminal')
  // t('public~Metrics')
  return (
    <DetailsPage
      {...props}
      getResourceStatus={podPhase}
      menuActions={menuActions}
      pages={[
        navFactory.details(Details),
        {
          href: 'metrics',
          nameKey: 'public~Metrics',
          component: PodMetrics,
        },
        navFactory.editYaml(),
        navFactory.envEditor(PodEnvironmentComponent),
        navFactory.logs(PodLogs),
        navFactory.events(ResourceEventStream),
        {
          href: 'terminal',
          nameKey: 'public~Terminal',
          component: PodExecLoader,
        },
      ]}
    />
  );
};
PodsDetailsPage.displayName = 'PodsDetailsPage';

const getRow = (showNodes, showNamespaceOverride) => {
  return (rowArgs: RowFunctionArgs<PodKind>) => (
    <PodTableRow
      obj={rowArgs.obj}
      index={rowArgs.index}
      rowKey={rowArgs.key}
      style={rowArgs.style}
      showNodes={showNodes}
      showNamespaceOverride={showNamespaceOverride}
      tableColumns={rowArgs.customData?.tableColumns}
    />
  );
};

export const PodList: React.FC<PodListProps> = withUserSettingsCompatibility<
  PodListProps & WithUserSettingsCompatibilityProps<TableColumnsType>,
  TableColumnsType
>(
  COLUMN_MANAGEMENT_CONFIGMAP_KEY,
  COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
  undefined,
  true,
)(({ userSettingState: tableColumns, ...props }) => {
  const showNodes = props?.customData?.showNodes;
  const showNamespaceOverride = props?.customData?.showNamespaceOverride;
  const { t } = useTranslation();
  const selectedColumns: Set<string> =
    tableColumns?.[columnManagementID]?.length > 0
      ? new Set(tableColumns[columnManagementID])
      : null;
  return (
    <Table
      {...props}
      activeColumns={selectedColumns}
      columnManagementID={columnManagementID}
      showNamespaceOverride={showNamespaceOverride}
      aria-label={t('public~Pods')}
      Header={getHeader(showNodes)}
      Row={getRow(showNodes, showNamespaceOverride)}
      customData={{ tableColumns: tableColumns?.[columnManagementID] }}
      virtualize
    />
  );
});
PodList.displayName = 'PodList';

export const getFilters = () => [
  {
    filterGroupName: i18next.t('public~Status'),
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
)(
  withUserSettingsCompatibility<
    PodPagePropsFromDispatch & PodPageProps & WithUserSettingsCompatibilityProps<TableColumnsType>,
    TableColumnsType
  >(
    COLUMN_MANAGEMENT_CONFIGMAP_KEY,
    COLUMN_MANAGEMENT_LOCAL_STORAGE_KEY,
    undefined,
    true,
  )(
    (
      props: PodPageProps &
        PodPagePropsFromDispatch &
        WithUserSettingsCompatibilityProps<TableColumnsType>,
    ) => {
      const {
        canCreate = true,
        namespace,
        setPodMetrics,
        customData,
        userSettingState: tableColumns,
        ...listProps
      } = props;
      const { t } = useTranslation();

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
          kind={kind}
          ListComponent={PodList}
          rowFilters={getFilters()}
          namespace={namespace}
          customData={customData}
          columnLayout={{
            columns: getHeader(props?.customData?.showNodes)().map((column) =>
              _.pick(column, ['title', 'additional', 'id']),
            ),
            id: columnManagementID,
            selectedColumns:
              tableColumns?.[columnManagementID]?.length > 0
                ? new Set(tableColumns[columnManagementID])
                : null,
            showNamespaceOverride: props?.customData?.showNamespaceOverride,
            type: t('public~Pod'),
          }}
        />
      );
    },
  ),
);

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

type PodStatusPopoverProps = {
  bodyContent: string;
  headerContent?: string;
  status: string;
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
  tableColumns: string[];
  showNodes?: boolean;
  showNamespaceOverride?: boolean;
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
