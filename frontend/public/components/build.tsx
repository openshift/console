import * as React from 'react';
import * as _ from 'lodash-es';
import { Icon } from 'patternfly-react';
import { Link } from 'react-router-dom';

import { K8sResourceKindReference, referenceFor, K8sResourceKind, k8sPatch, K8sKind } from '../module/k8s';
import { cloneBuild, formatBuildDuration, BuildPhase, getBuildNumber } from '../module/k8s/builds';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { errorModal, confirmModal } from './modals';
import {
  AsyncComponent,
  BuildHooks,
  BuildStrategy,
  history,
  humanizeCpuCores,
  humanizeDecimalBytes,
  Kebab,
  KebabAction,
  navFactory,
  ResourceKebab,
  ResourceLink,
  resourceObjPath,
  resourcePath,
  ResourceSummary,
  SectionHeading,
  StatusIcon,
  Timestamp,
} from './utils';
import { BuildPipeline, BuildPipelineLogLink } from './build-pipeline';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { fromNow } from './utils/datetime';
import { BuildLogs } from './build-logs';
import { ResourceEventStream } from './events';
import { Area, requirePrometheus } from './graphs';

const BuildsReference: K8sResourceKindReference = 'Build';

const { common, EditEnvironment } = Kebab.factory;

const CloneBuildAction: KebabAction = (kind: K8sKind, build: K8sResourceKind) => ({
  label: 'Rebuild',
  callback: () => cloneBuild(build).then(clone => {
    history.push(resourceObjPath(clone, referenceFor(clone)));
  }).catch(err => {
    const error = err.message;
    errorModal({ error });
  }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.path,
    subresource: 'instantiate',
    name: build.metadata.name,
    namespace: build.metadata.namespace,
    verb: 'create',
  },
});

const CancelAction: KebabAction = (kind: K8sKind, build: K8sResourceKind) => ({
  label: 'Cancel Build',
  hidden: build.status.phase !== 'Running' && build.status.phase !== 'Pending' && build.status.phase !== 'New',
  callback: () => confirmModal({
    title: 'Cancel build',
    message: 'Are you sure you want to cancel this build?',
    btnText: 'Yes, cancel',
    cancelText: 'No, don\'t cancel',
    executeFn: () => k8sPatch(kind,
      build,
      [{ op: 'add', path: '/status/cancelled', value: true }]),
  }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.path,
    name: build.metadata.name,
    namespace: build.metadata.namespace,
    verb: 'patch',
  },
});

const menuActions = [
  CloneBuildAction,
  CancelAction,
  EditEnvironment,
  ...common,
];

export enum BuildStrategyType {
  Docker = 'Docker',
  Custom = 'Custom',
  JenkinsPipeline = 'JenkinsPipeline',
  Source = 'Source',
}

export const BuildPhaseIcon: React.SFC<BuildPhaseIconProps> = ({build}) => {
  const {status: {phase}} = build;
  switch (phase) {
    case BuildPhase.Running:
      return <span className="fa fa-spin fa-refresh" aria-hidden="true" />;
    case BuildPhase.Complete:
      return <Icon type="pf" name="ok" />;
    case BuildPhase.Failed:
    case BuildPhase.Error:
      return <Icon type="pf" name="error-circle-o" />;
    case BuildPhase.Cancelled:
      return <Icon type="fa" name="ban" />;
    default:
      return <Icon type="fa" name="clock-o" />;
  }
};

export const BuildLogLink = ({build}) => {
  const {metadata: {name, namespace}} = build;
  const isPipeline = _.get(build, 'spec.strategy.type') === BuildStrategyType.JenkinsPipeline;
  return isPipeline
    ? <BuildPipelineLogLink obj={build} />
    : <Link to={`${resourcePath('Build', name, namespace)}/logs`}>
    View Logs
    </Link>;
};

export const BuildNumberLink = ({build}) => {
  const {metadata: {name, namespace}} = build;
  const buildNumber = getBuildNumber(build);
  const title = _.isFinite(buildNumber) ? `#${buildNumber}` : name;

  return <Link to={resourcePath('Build', name, namespace)}>
    {title}
  </Link>;
};

const BuildGraphs = requirePrometheus(({build}) => {
  const podName = _.get(build, ['metadata', 'annotations', 'openshift.io/build.pod-name']);
  if (!podName) {
    return null;
  }

  const namespace = build.metadata.namespace;

  return <React.Fragment>
    <div className="row">
      <div className="col-md-4">
        <Area
          title="Memory Usage"
          formatY={humanizeDecimalBytes}
          namespace={namespace}
          query={`pod_name:container_memory_usage_bytes:sum{pod_name='${podName}',container_name='',namespace='${namespace}'}`}
        />
      </div>
      <div className="col-md-4">
        <Area
          title="CPU Usage"
          formatY={humanizeCpuCores}
          namespace={namespace}
          query={`pod_name:container_cpu_usage:sum{pod_name='${podName}',container_name='',namespace='${namespace}'}`}
        />
      </div>
      <div className="col-md-4">
        <Area
          title="Filesystem"
          formatY={humanizeDecimalBytes}
          namespace={namespace}
          query={`pod_name:container_fs_usage_bytes:sum{pod_name='${podName}',container_name='',namespace='${namespace}'}`}
        />
      </div>
    </div>
    <br />
  </React.Fragment>;
});

export const BuildsDetails: React.SFC<BuildsDetailsProps> = ({ obj: build }) => {
  const { logSnippet, message, startTimestamp } = build.status;
  const triggeredBy = _.map(build.spec.triggeredBy, 'message').join(', ');
  const duration = formatBuildDuration(build);
  const hasPipeline = build.spec.strategy.type === BuildStrategyType.JenkinsPipeline;

  return <React.Fragment>
    <div className="co-m-pane__body">
      <SectionHeading text="Build Overview" />
      <BuildGraphs build={build} />
      {hasPipeline && <div className="row">
        <div className="col-xs-12">
          <BuildPipeline obj={build} />
        </div>
      </div>}
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={build}>
            {triggeredBy && <dt>Triggered By</dt>}
            {triggeredBy && <dd>{triggeredBy}</dd>}
            {startTimestamp && <dt>Started</dt>}
            {startTimestamp && <dd><Timestamp timestamp={startTimestamp} /></dd>}
          </ResourceSummary>
        </div>
        <div className="col-sm-6">
          <BuildStrategy resource={build}>
            <dt>Status</dt>
            <dd>{build.status.phase}</dd>
            {logSnippet && <dt>Log Snippet</dt>}
            {logSnippet && <dd><pre>{logSnippet}</pre></dd>}
            {message && <dt>Reason</dt>}
            {message && <dd>{message}</dd>}
            {duration && <dt>Duration</dt>}
            {duration && <dd>{duration}</dd>}
          </BuildStrategy>
        </div>
      </div>
    </div>
    <BuildHooks resource={build} />
  </React.Fragment>;
};

export const getStrategyType = (strategy: BuildStrategyType) => {
  switch (strategy) {
    case BuildStrategyType.Docker:
      return 'dockerStrategy';
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

const EnvironmentPage = (props) => <AsyncComponent loader={() => import('./environment.jsx').then(c => c.EnvironmentPage)} {...props} />;

export const BuildEnvironmentComponent = (props) => {
  const {obj} = props;
  const readOnly = obj.kind === 'Build';
  const envPath = getEnvPath(props);
  if (envPath) {
    return <EnvironmentPage
      obj={obj}
      rawEnvData={obj.spec.strategy[getStrategyType(obj.spec.strategy.type)]}
      envPath={getEnvPath(props)}
      readOnly={readOnly} />;
  }
  return <div className="cos-status-box">
    <div className="text-center">The environment variable editor does not support build
      strategy: {obj.spec.strategy.type}.
    </div>
  </div>;
};

const pages = [
  navFactory.details(BuildsDetails),
  navFactory.editYaml(),
  navFactory.envEditor(BuildEnvironmentComponent),
  navFactory.logs(BuildLogs),
  navFactory.events(ResourceEventStream),
];

export const BuildsDetailsPage: React.SFC<BuildsDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    breadcrumbsFor={obj => breadcrumbsForOwnerRefs(obj).concat({
      name: 'Build Details',
      path: props.match.url,
    })}
    kind={BuildsReference}
    menuActions={menuActions}
    pages={pages} />;
BuildsDetailsPage.displayName = 'BuildsDetailsPage';

const BuildsHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-3 hidden-xs" sortField="status.phase">Status</ColHead>
  <ColHead {...props} className="col-sm-3 hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const BuildsRow: React.SFC<BuildsRowProps> = ({ obj }) => <div className="row co-resource-list__item">
  <div className="col-sm-3 col-xs-6">
    <ResourceLink kind={BuildsReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-sm-3 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
  </div>
  <div className="col-sm-3 hidden-xs">
    <StatusIcon status={obj.status.phase} />
  </div>
  <div className="col-sm-3 hidden-xs">
    {fromNow(obj.metadata.creationTimestamp)}
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={BuildsReference} resource={obj} />
  </div>
</div>;

export const BuildsList: React.SFC = props => <List {...props} Header={BuildsHeader} Row={BuildsRow} />;
BuildsList.displayName = 'BuildsList';

export const buildPhase = build => build.status.phase;

const allPhases = ['New', 'Pending', 'Running', 'Complete', 'Failed', 'Error', 'Cancelled'];
const filters = [{
  type: 'build-status',
  selected: allPhases,
  reducer: buildPhase,
  items: _.map(allPhases, phase => ({
    id: phase,
    title: phase,
  })),
}];

export const BuildsPage: React.SFC<BuildsPageProps> = props =>
  <ListPage
    {...props}
    title="Builds"
    kind={BuildsReference}
    ListComponent={BuildsList}
    canCreate={false}
    rowFilters={filters}
  />;
BuildsPage.displayName = 'BuildsListPage';

export type BuildsRowProps = {
  obj: any,
};

export type BuildsDetailsProps = {
  obj: any,
};

export type BuildsPageProps = {
  showTitle?: boolean,
  namespace?: string,
  selector?: any,
};

export type BuildsDetailsPageProps = {
  match: any,
};

export type BuildPhaseIconProps = {
  build: K8sResourceKind
};
