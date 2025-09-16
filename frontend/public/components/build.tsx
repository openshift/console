import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import {
  Alert,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';

import { ONE_HOUR, ONE_MINUTE, Status, usePrometheusGate } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import { LazyActionMenu, ActionMenuVariant } from '@console/shared/src/components/actions';
import {
  K8sResourceKindReference,
  referenceFor,
  referenceForModel,
  K8sResourceKind,
  K8sModel,
} from '../module/k8s';
import { getBuildNumber } from '../module/k8s/builds';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import {
  AsyncComponent,
  BuildHooks,
  BuildStrategy,
  ConsoleEmptyState,
  DetailsItem,
  documentationURLs,
  getDocumentationURL,
  humanizeBinaryBytes,
  humanizeCpuCores,
  isManaged,
  isUpstream,
  Kebab,
  navFactory,
  ResourceLink,
  resourcePath,
  ResourceSummary,
  SectionHeading,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { BuildPipeline, BuildPipelineLogLink } from './build-pipeline';
import { BuildLogs } from './build-logs';
import { ResourceEventStream } from './events';
import { Area } from './graphs';
import { BuildConfigModel } from '../models';
import { timeFormatter, timeFormatterWithSeconds } from './utils/datetime';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import { displayDurationInWords } from './utils/build-utils';

const BuildsReference: K8sResourceKindReference = 'Build';

export enum BuildStrategyType {
  Docker = 'Docker',
  Devfile = 'Devfile',
  Custom = 'Custom',
  JenkinsPipeline = 'JenkinsPipeline',
  Source = 'Source',
}

export const BuildLogLink = ({ build }) => {
  const {
    metadata: { name, namespace },
  } = build;
  const isPipeline = _.get(build, 'spec.strategy.type') === BuildStrategyType.JenkinsPipeline;
  const { t } = useTranslation();
  return isPipeline ? (
    <BuildPipelineLogLink obj={build} />
  ) : (
    <Link to={`${resourcePath('Build', name, namespace)}/logs`}>{t('public~View logs')}</Link>
  );
};

export const BuildNumberLink = ({ build }) => {
  const {
    metadata: { name, namespace },
  } = build;
  const buildNumber = getBuildNumber(build);
  const title = _.isFinite(buildNumber) ? `#${buildNumber}` : name;

  return <Link to={resourcePath('Build', name, namespace)}>{title}</Link>;
};

// TODO update to use QueryBrowser for each graph
const BuildMetrics = ({ obj }) => {
  const { t } = useTranslation();
  const podName = obj.metadata.annotations?.['openshift.io/build.pod-name'];
  const endTime = obj.status.completionTimestamp
    ? new Date(obj.status.completionTimestamp).getTime()
    : Date.now();
  const runTime = obj.status.startTimestamp
    ? endTime - new Date(obj.status.startTimestamp).getTime()
    : ONE_HOUR;
  const timespan = Math.max(runTime, ONE_MINUTE); // Minimum timespan of one minute
  const namespace = obj.metadata.namespace;
  const domain = React.useMemo(() => ({ x: [endTime - timespan, endTime] }), [endTime, timespan]);
  const areaProps = React.useMemo(
    () => ({
      namespace,
      endTime,
      timespan,
      formatDate: (d) =>
        timespan < 5 * ONE_MINUTE ? timeFormatterWithSeconds.format(d) : timeFormatter.format(d),
      domain, // force domain to match queried timespan
    }),
    [domain, endTime, namespace, timespan],
  );

  return podName ? (
    <Dashboard className="resource-metrics-dashboard">
      <Grid hasGutter>
        <GridItem xl={6} lg={12}>
          <Card className="resource-metrics-dashboard__card">
            <CardHeader>
              <CardTitle>{t('public~Memory usage')}</CardTitle>
            </CardHeader>
            <CardBody className="resource-metrics-dashboard__card-body">
              <Area
                byteDataType={ByteDataTypes.BinaryBytes}
                humanize={humanizeBinaryBytes}
                query={`sum(container_memory_working_set_bytes{pod='${podName}',namespace='${namespace}',container=''}) BY (pod, namespace)`}
                {...areaProps}
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
                humanize={humanizeCpuCores}
                query={`pod:container_cpu_usage:sum{pod='${podName}',container='',namespace='${namespace}'}`}
                {...areaProps}
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
                byteDataType={ByteDataTypes.BinaryBytes}
                humanize={humanizeBinaryBytes}
                query={`pod:container_fs_usage_bytes:sum{pod='${podName}',container='',namespace='${namespace}'}`}
                {...areaProps}
              />
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
      <br />
    </Dashboard>
  ) : null;
};

const OpenShiftPipelines: React.FCC = () => {
  const { t } = useTranslation();
  const text = t('public~OpenShift Pipelines based on Tekton');
  return isUpstream() || isManaged() ? (
    <>{text}</>
  ) : (
    <ExternalLink href={getDocumentationURL(documentationURLs.pipelines)} text={text} />
  );
};

export const PipelineBuildStrategyAlert: React.FCC<BuildsDetailsProps> = () => {
  const { t } = useTranslation();
  return (
    <Alert
      isInline
      className="co-alert"
      variant="info"
      title={t('public~Pipeline build strategy deprecation')}
    >
      <Trans t={t} ns="public">
        With the release of <OpenShiftPipelines />, the pipelines build strategy has been
        deprecated. Users should either use Jenkins files directly on Jenkins or use cloud-native
        CI/CD with Openshift Pipelines.{' '}
        <ExternalLink
          href="https://github.com/openshift/pipelines-tutorial/"
          text={t('public~Try the OpenShift Pipelines tutorial')}
        />
      </Trans>
    </Alert>
  );
};

export const BuildsDetails: React.FCC<BuildsDetailsProps> = ({ obj: build }) => {
  const { logSnippet, message, startTimestamp, completionTimestamp } = build.status;
  const triggeredBy = _.map(build.spec.triggeredBy, 'message').join(', ');
  const hasPipeline = build.spec.strategy.type === BuildStrategyType.JenkinsPipeline;
  const { t } = useTranslation();
  const BUILDCONFIG_TO_BUILD_REFERENCE_LABEL = 'openshift.io/build-config.name';
  const buildConfigName =
    build.status.config?.name || build.metadata.labels?.[BUILDCONFIG_TO_BUILD_REFERENCE_LABEL];
  return (
    <>
      <PaneBody>
        {hasPipeline && <PipelineBuildStrategyAlert obj={build} />}
        <SectionHeading text={t('public~Build details')} />
        <Grid hasGutter>
          {hasPipeline && (
            <GridItem>
              <BuildPipeline obj={build} />
            </GridItem>
          )}
          <GridItem sm={6}>
            <ResourceSummary resource={build}>
              <DetailsItem
                label={t('public~Triggered by')}
                obj={build}
                path="spec.triggeredBy"
                hideEmpty
              >
                {triggeredBy}
              </DetailsItem>
            </ResourceSummary>
          </GridItem>
          <GridItem sm={6}>
            <BuildStrategy resource={build}>
              <DetailsItem label={t('public~Status')} obj={build} path="status.phase">
                <Status status={build.status.phase} />
              </DetailsItem>

              {buildConfigName && (
                <DetailsItem label={t('public~BuildConfig')} obj={build} path="status.config">
                  <ResourceLink
                    groupVersionKind={getGroupVersionKindForModel(BuildConfigModel)}
                    namespace={build.metadata.namespace}
                    name={buildConfigName}
                  />
                </DetailsItem>
              )}
              <DetailsItem
                label={t('public~Start time')}
                obj={build}
                path="status.startTimestamp"
                hideEmpty
              >
                <Timestamp timestamp={startTimestamp} />
              </DetailsItem>
              <DetailsItem
                label={t('public~Completion time')}
                obj={build}
                path="status.completionTimestamp"
                hideEmpty
              >
                <Timestamp timestamp={completionTimestamp} />
              </DetailsItem>
              <DetailsItem label={t('public~Duration')} obj={build} path="status.duration">
                {displayDurationInWords(
                  build?.status?.startTimestamp,
                  build?.status?.completionTimestamp,
                )}
              </DetailsItem>
              <DetailsItem label={t('public~Message')} obj={build} path="status.message" hideEmpty>
                {message}
              </DetailsItem>
              <DetailsItem
                label={t('public~Log snippet')}
                obj={build}
                path="status.logSnippet"
                hideEmpty
              >
                <pre className="co-pre">{logSnippet}</pre>
              </DetailsItem>
            </BuildStrategy>
          </GridItem>
        </Grid>
      </PaneBody>
      <BuildHooks resource={build} />
    </>
  );
};

export const getStrategyType = (strategy: BuildStrategyType) => {
  switch (strategy) {
    case BuildStrategyType.Docker:
      return 'dockerStrategy';
    case BuildStrategyType.Devfile:
      return 'devfileStrategy';
    case BuildStrategyType.Custom:
      return 'customStrategy';
    case BuildStrategyType.JenkinsPipeline:
      return 'jenkinsPipelineStrategy';
    case BuildStrategyType.Source:
      return 'sourceStrategy';
    default:
      return null;
  }
};

export const getEnvPath = (props) => {
  const strategyType = getStrategyType(props.obj.spec.strategy.type);
  return strategyType ? ['spec', 'strategy', strategyType] : null;
};

const EnvironmentPage = (props) => (
  <AsyncComponent
    loader={() => import('./environment.jsx').then((c) => c.EnvironmentPage)}
    {...props}
  />
);

export const BuildEnvironmentComponent = (props) => {
  const { obj } = props;
  const readOnly = obj.kind === 'Build';
  const envPath = getEnvPath(props);
  const { t } = useTranslation();
  if (envPath) {
    return (
      <EnvironmentPage
        obj={obj}
        rawEnvData={obj.spec.strategy[getStrategyType(obj.spec.strategy.type)]}
        envPath={getEnvPath(props)}
        readOnly={readOnly}
      />
    );
  }
  return (
    <ConsoleEmptyState>
      {t('public~The environment variable editor does not support build strategy: {{ type }}', {
        type: obj.spec.strategy.type,
      })}
      .
    </ConsoleEmptyState>
  );
};

export const BuildsDetailsPage: React.FCC = (props) => {
  const prometheusIsAvailable = usePrometheusGate();

  return (
    <DetailsPage
      {...props}
      kind={BuildsReference}
      customActionMenu={(kindObj: K8sModel, obj: K8sResourceKind) => {
        const reference = referenceForModel(kindObj);
        const context = { [reference]: obj };
        return <LazyActionMenu context={context} variant={ActionMenuVariant.DROPDOWN} />;
      }}
      pages={[
        navFactory.details(BuildsDetails),
        ...(prometheusIsAvailable ? [navFactory.metrics(BuildMetrics)] : []),
        navFactory.editYaml(),
        navFactory.envEditor(BuildEnvironmentComponent),
        navFactory.logs(BuildLogs),
        navFactory.events(ResourceEventStream),
      ]}
    />
  );
};
BuildsDetailsPage.displayName = 'BuildsDetailsPage';

const tableColumnClasses = [
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const BuildsTableRow: React.FCC<RowFunctionArgs<K8sResourceKind>> = ({ obj }) => {
  const kindReference = referenceFor(obj);
  const context = { [kindReference]: obj };

  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={BuildsReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={obj.status?.phase} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.status?.startTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {displayDurationInWords(obj.status?.startTimestamp, obj.status?.completionTimestamp)}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

export const BuildsList: React.FCC = (props) => {
  const { t } = useTranslation();
  const BuildsTableHeader = () => {
    return [
      {
        title: t('public~Name'),
        sortField: 'metadata.name',
        transforms: [sortable],
        props: { className: tableColumnClasses[0] },
      },
      {
        title: t('public~Namespace'),
        sortField: 'metadata.namespace',
        transforms: [sortable],
        props: { className: tableColumnClasses[1] },
        id: 'namespace',
      },
      {
        title: t('public~Status'),
        sortField: 'status.phase',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Start time'),
        sortField: 'status.startTimestamp',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Duration'),
        sortField: 'status.duration',
        transforms: [sortable],
        props: { className: tableColumnClasses[3] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[4] },
      },
    ];
  };
  BuildsTableHeader.displayName = 'BuildsTableHeader';

  return (
    <Table
      {...props}
      aria-label={t('public~Builds')}
      Header={BuildsTableHeader}
      Row={BuildsTableRow}
      virtualize
    />
  );
};

BuildsList.displayName = 'BuildsList';

export const buildPhase = (build) => build.status.phase;

export const allPhases = ['New', 'Pending', 'Running', 'Complete', 'Failed', 'Error', 'Cancelled'];

export const BuildsPage: React.FCC<BuildsPageProps> = (props) => {
  const { t } = useTranslation();
  return (
    <ListPage
      {...props}
      title={t('public~Builds')}
      kind={BuildsReference}
      ListComponent={BuildsList}
      canCreate={false}
      rowFilters={[
        {
          filterGroupName: t('public~Status'),
          type: 'build-status',
          reducer: buildPhase,
          items: _.map(allPhases, (phase) => ({
            id: phase,
            title: phase,
          })),
        },
      ]}
    />
  );
};
BuildsPage.displayName = 'BuildsListPage';

export type BuildsDetailsProps = {
  obj: any;
};

export type BuildsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};
