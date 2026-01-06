import { useMemo, Suspense } from 'react';
import * as _ from 'lodash';
import { Link } from 'react-router-dom-v5-compat';
import { Trans, useTranslation } from 'react-i18next';
import {
  Alert,
  Grid,
  GridItem,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from '@patternfly/react-core';

import { ONE_HOUR, ONE_MINUTE } from '@console/shared/src/constants/time';
import Status from '@console/dynamic-plugin-sdk/src/app/components/status/Status';
import { usePrometheusGate } from '@console/shared/src/hooks/usePrometheusGate';
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
  TableColumn,
} from '../module/k8s';
import { getBuildNumber } from '../module/k8s/builds';
import { DetailsPage } from './factory/details';
import { ListPage } from './factory/list-page';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { AsyncComponent } from './utils/async';
import { BuildHooks } from './utils/build-hooks';
import { BuildStrategy } from './utils/build-strategy';
import { ConsoleEmptyState, LoadingBox } from './utils/status-box';
import { DetailsItem } from './utils/details-item';
import {
  documentationURLs,
  getDocumentationURL,
  isManaged,
  isUpstream,
} from './utils/documentation';
import { humanizeBinaryBytes, humanizeCpuCores } from './utils/units';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink, resourcePath } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { BuildPipeline, BuildPipelineLogLink } from './build-pipeline';
import { BuildLogs } from './build-logs';
import { ResourceEventStream } from './events';
import { Area } from './graphs';
import { BuildConfigModel, BuildModel } from '../models';
import { timeFormatter, timeFormatterWithSeconds } from './utils/datetime';
import Dashboard from '@console/shared/src/components/dashboard/Dashboard';
import { BuildStrategyType, getStrategyType, displayDurationInWords } from './utils/build-utils';
const BuildsReference: K8sResourceKindReference = 'Build';

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
  const domain = useMemo(() => ({ x: [endTime - timespan, endTime] }), [endTime, timespan]);
  const areaProps = useMemo(
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

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'status' },
  { id: 'startTime' },
  { id: 'duration' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<K8sResourceKind> = (data, columns) => {
  return data.map(({ obj }) => {
    const { name, namespace } = obj.metadata;
    const kindReference = referenceFor(obj);
    const context = { [kindReference]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={BuildsReference} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <Status status={obj.status?.phase} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <Timestamp timestamp={obj.status?.startTimestamp} />,
      },
      [tableColumnInfo[4].id]: {
        cell: displayDurationInWords(obj.status?.startTimestamp, obj.status?.completionTimestamp),
      },
      [tableColumnInfo[5].id]: {
        cell: <LazyActionMenu context={context} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || '-';
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useBuildsColumns = (): TableColumn<K8sResourceKind>[] => {
  const { t } = useTranslation();
  const columns = useMemo(() => {
    return [
      {
        title: t('public~Name'),
        id: tableColumnInfo[0].id,
        sort: 'metadata.name',
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Namespace'),
        id: tableColumnInfo[1].id,
        sort: 'metadata.namespace',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Status'),
        id: tableColumnInfo[2].id,
        sort: 'status.phase',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Start time'),
        id: tableColumnInfo[3].id,
        sort: 'status.startTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Duration'),
        id: tableColumnInfo[4].id,
        sort: 'status.duration',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[5].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

export const BuildsList: React.FCC<BuildsListProps> = ({ data, loaded, ...props }) => {
  const columns = useBuildsColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView
        {...props}
        label={BuildModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </Suspense>
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
      omitFilterToolbar={true}
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

type BuildsListProps = {
  data: K8sResourceKind[];
  loaded: boolean;
};
