import * as React from 'react';
import * as _ from 'lodash-es';
import { Link } from 'react-router-dom';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { Alert } from '@patternfly/react-core';

import { Status } from '@console/shared';
import { ByteDataTypes } from '@console/shared/src/graph-helper/data-utils';
import {
  K8sResourceKindReference,
  referenceFor,
  K8sResourceKind,
  k8sPatch,
  K8sKind,
} from '../module/k8s';
import { cloneBuild, formatBuildDuration, getBuildNumber } from '../module/k8s/builds';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
import { errorModal, confirmModal } from './modals';
import {
  AsyncComponent,
  BuildHooks,
  BuildStrategy,
  DetailsItem,
  ExternalLink,
  history,
  humanizeBinaryBytes,
  humanizeCpuCores,
  Kebab,
  KebabAction,
  navFactory,
  ResourceKebab,
  ResourceLink,
  resourceObjPath,
  resourcePath,
  ResourceSummary,
  SectionHeading,
  Timestamp,
} from './utils';
import { BuildPipeline, BuildPipelineLogLink } from './build-pipeline';
import { BuildLogs } from './build-logs';
import { ResourceEventStream } from './events';
import { Area, requirePrometheus } from './graphs';
import { BuildModel } from '../models';

const BuildsReference: K8sResourceKindReference = 'Build';

const CloneBuildAction: KebabAction = (kind: K8sKind, build: K8sResourceKind) => ({
  label: 'Rebuild',
  callback: () =>
    cloneBuild(build)
      .then((clone) => {
        history.push(resourceObjPath(clone, referenceFor(clone)));
      })
      .catch((err) => {
        const error = err.message;
        errorModal({ error });
      }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    subresource: 'clone',
    name: build.metadata.name,
    namespace: build.metadata.namespace,
    verb: 'create',
  },
});

const CancelAction: KebabAction = (kind: K8sKind, build: K8sResourceKind) => ({
  label: 'Cancel Build',
  hidden:
    build.status.phase !== 'Running' &&
    build.status.phase !== 'Pending' &&
    build.status.phase !== 'New',
  callback: () =>
    confirmModal({
      title: 'Cancel build',
      message: 'Are you sure you want to cancel this build?',
      btnText: 'Yes, cancel',
      cancelText: "No, don't cancel",
      executeFn: () =>
        k8sPatch(kind, build, [{ op: 'add', path: '/status/cancelled', value: true }]),
    }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    name: build.metadata.name,
    namespace: build.metadata.namespace,
    verb: 'patch',
  },
});

const menuActions = [
  CloneBuildAction,
  CancelAction,
  ...Kebab.getExtensionsActionsForKind(BuildModel),
  ...Kebab.factory.common,
];

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
  return isPipeline ? (
    <BuildPipelineLogLink obj={build} />
  ) : (
    <Link to={`${resourcePath('Build', name, namespace)}/logs`}>View logs</Link>
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

const BuildGraphs = requirePrometheus(({ build }) => {
  const podName = _.get(build, ['metadata', 'annotations', 'openshift.io/build.pod-name']);
  if (!podName) {
    return null;
  }

  const namespace = build.metadata.namespace;

  return (
    <>
      <div className="row">
        <div className="col-md-12 col-lg-4">
          <Area
            title="Memory Usage"
            humanize={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            namespace={namespace}
            query={`sum(container_memory_working_set_bytes{pod='${podName}',namespace='${namespace}',container=''}) BY (pod, namespace)`}
          />
        </div>
        <div className="col-md-12 col-lg-4">
          <Area
            title="CPU Usage"
            humanize={humanizeCpuCores}
            namespace={namespace}
            query={`pod:container_cpu_usage:sum{pod='${podName}',container='',namespace='${namespace}'}`}
          />
        </div>
        <div className="col-md-12 col-lg-4">
          <Area
            title="Filesystem"
            humanize={humanizeBinaryBytes}
            byteDataType={ByteDataTypes.BinaryBytes}
            namespace={namespace}
            query={`pod:container_fs_usage_bytes:sum{pod='${podName}',container='',namespace='${namespace}'}`}
          />
        </div>
      </div>
      <br />
    </>
  );
});

export const PipelineBuildStrategyAlert: React.FC<BuildsDetailsProps> = () => {
  return (
    <Alert isInline className="co-alert" variant="info" title="Pipeline build strategy deprecation">
      With the release of{' '}
      <ExternalLink
        href="https://openshift.github.io/pipelines-docs/"
        text="OpenShift Pipelines based on Tekton"
      />
      , the pipelines build strategy has been deprecated. Users should either use Jenkins files
      directly on Jenkins or use cloud-native CI/CD with Openshift Pipelines.
      <ExternalLink
        href="https://github.com/openshift/pipelines-tutorial/"
        text="Try the OpenShift Pipelines tutorial"
      />
    </Alert>
  );
};

export const BuildsDetails: React.SFC<BuildsDetailsProps> = ({ obj: build }) => {
  const { logSnippet, message, startTimestamp } = build.status;
  const triggeredBy = _.map(build.spec.triggeredBy, 'message').join(', ');
  const duration = formatBuildDuration(build);
  const hasPipeline = build.spec.strategy.type === BuildStrategyType.JenkinsPipeline;

  return (
    <>
      <div className="co-m-pane__body">
        {hasPipeline && <PipelineBuildStrategyAlert obj={build} />}
        <SectionHeading text="Build Details" />
        <BuildGraphs build={build} />
        {hasPipeline && (
          <div className="row">
            <div className="col-xs-12">
              <BuildPipeline obj={build} />
            </div>
          </div>
        )}
        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={build}>
              <DetailsItem label="Triggered By" obj={build} path="spec.triggeredBy" hideEmpty>
                {triggeredBy}
              </DetailsItem>
              <DetailsItem label="Started" obj={build} path="status.startTimestamp" hideEmpty>
                <Timestamp timestamp={startTimestamp} />
              </DetailsItem>
            </ResourceSummary>
          </div>
          <div className="col-sm-6">
            <BuildStrategy resource={build}>
              <DetailsItem label="Status" obj={build} path="status.phase">
                <Status status={build.status.phase} />
              </DetailsItem>
              <DetailsItem label="Message" obj={build} path="status.message" hideEmpty>
                {message}
              </DetailsItem>
              <DetailsItem label="Log Snippet" obj={build} path="status.logSnippet" hideEmpty>
                <pre>{logSnippet}</pre>
              </DetailsItem>
              <DetailsItem label="Duration" obj={build} path="status.duration" hideEmpty>
                {duration}
              </DetailsItem>
            </BuildStrategy>
          </div>
        </div>
      </div>
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
    <div className="cos-status-box">
      <div className="text-center">
        The environment variable editor does not support build strategy: {obj.spec.strategy.type}.
      </div>
    </div>
  );
};

const pages = [
  navFactory.details(BuildsDetails),
  navFactory.editYaml(),
  navFactory.envEditor(BuildEnvironmentComponent),
  navFactory.logs(BuildLogs),
  navFactory.events(ResourceEventStream),
];

export const BuildsDetailsPage: React.SFC<BuildsDetailsPageProps> = (props) => (
  <DetailsPage {...props} kind={BuildsReference} menuActions={menuActions} pages={pages} />
);
BuildsDetailsPage.displayName = 'BuildsDetailsPage';

const tableColumnClasses = [
  classNames('col-sm-3', 'col-xs-6'),
  classNames('col-sm-3', 'col-xs-6'),
  classNames('col-sm-3', 'hidden-xs'),
  classNames('col-sm-3', 'hidden-xs'),
  Kebab.columnClass,
];

const BuildsTableHeader = () => {
  return [
    {
      title: 'Name',
      sortField: 'metadata.name',
      transforms: [sortable],
      props: { className: tableColumnClasses[0] },
    },
    {
      title: 'Namespace',
      sortField: 'metadata.namespace',
      transforms: [sortable],
      props: { className: tableColumnClasses[1] },
      id: 'namespace',
    },
    {
      title: 'Status',
      sortField: 'status.phase',
      transforms: [sortable],
      props: { className: tableColumnClasses[2] },
    },
    {
      title: 'Created',
      sortField: 'metadata.creationTimestamp',
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

const BuildsTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={BuildsReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <Status status={obj.status.phase} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={BuildsReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

export const BuildsList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Builds"
    Header={BuildsTableHeader}
    Row={BuildsTableRow}
    virtualize
  />
);

BuildsList.displayName = 'BuildsList';

export const buildPhase = (build) => build.status.phase;

const allPhases = ['New', 'Pending', 'Running', 'Complete', 'Failed', 'Error', 'Cancelled'];
const filters = [
  {
    filterGroupName: 'Status',
    type: 'build-status',
    reducer: buildPhase,
    items: _.map(allPhases, (phase) => ({
      id: phase,
      title: phase,
    })),
  },
];

export const BuildsPage: React.SFC<BuildsPageProps> = (props) => (
  <ListPage
    {...props}
    title="Builds"
    kind={BuildsReference}
    ListComponent={BuildsList}
    canCreate={false}
    rowFilters={filters}
  />
);
BuildsPage.displayName = 'BuildsListPage';

export type BuildsDetailsProps = {
  obj: any;
};

export type BuildsPageProps = {
  showTitle?: boolean;
  namespace?: string;
  selector?: any;
};

export type BuildsDetailsPageProps = {
  match: any;
};
