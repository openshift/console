import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKindReference, referenceFor } from '../module/k8s';
import { cloneBuild, formatBuildDuration } from '../module/k8s/builds';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { errorModal } from './modals';
import { BuildStrategy, Cog, history, navFactory, ResourceCog, ResourceLink, resourceObjPath, ResourceSummary, Timestamp } from './utils';
import { breadcrumbsForOwnerRefs } from './utils/breadcrumbs';
import { fromNow } from './utils/datetime';
import { EnvironmentPage } from './environment';
import { BuildLogs } from './build-logs';

const BuildsReference: K8sResourceKindReference = 'Build';

const { common, EditEnvironment } = Cog.factory;

const cloneBuildAction = (kind, build) => ({
  label: 'Rebuild',
  callback: () => cloneBuild(build).then(clone => {
    history.push(resourceObjPath(clone, referenceFor(clone)));
  }).catch(err => {
    const error = err.message;
    errorModal({error});
  }),
});

const menuActions = [
  cloneBuildAction,
  EditEnvironment,
  ...common,
];

export const BuildsDetails: React.SFC<BuildsDetailsProps> = ({obj: build}) => {
  const triggeredBy = _.map(build.spec.triggeredBy, 'message').join(', ');
  const started = _.get(build, 'status.startTimestamp');
  const duration = formatBuildDuration(build);

  return <div className="co-m-pane__body">
    <div className="row">
      <div className="col-sm-6">
        <ResourceSummary resource={build} showPodSelector={false} showNodeSelector={false}>
          {triggeredBy && <dt>Triggered By</dt>}
          {triggeredBy && <dd>{triggeredBy}</dd>}
          {started && <dt>Started</dt>}
          {started && <dd><Timestamp timestamp={started} /></dd>}
        </ResourceSummary>
      </div>
      <div className="col-sm-6">
        <BuildStrategy resource={build}>
          <dt>Status</dt>
          <dd>{build.status.phase}</dd>
          {build.status.message && <dt>Reason</dt>}
          {build.status.message && <dd>{build.status.message}</dd>}
          {duration && <dt>Duration</dt>}
          {duration && <dd>{duration}</dd>}
        </BuildStrategy>
      </div>
    </div>
  </div>;
};

export const getStrategyType = (strategy) => {
  switch (strategy.type) {
    case 'Docker':
      return 'dockerStrategy';
    case 'Custom':
      return 'customStrategy';
    case 'JenkinsPipeline':
      return 'jenkinsPipelineStrategy';
    default:
      return 'sourceStrategy';
  }
};

export const getEnvPath = (props) => {
  return ['spec', 'strategy', getStrategyType(props.obj.spec.strategy)];
};

const environmentComponent = (props) => <EnvironmentPage
  obj={props.obj}
  rawEnvData={props.obj.spec.strategy[getStrategyType(props.obj.spec.strategy)]}
  envPath={getEnvPath(props)}
  readOnly={true}
/>;

const pages = [navFactory.details(BuildsDetails), navFactory.editYaml(), navFactory.envEditor(environmentComponent), navFactory.logs(BuildLogs)];
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
  <ColHead {...props} className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="status.phase">Status</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const BuildsRow: React.SFC<BuildsRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-xs-3">
    <ResourceCog actions={menuActions} kind={BuildsReference} resource={obj} />
    <ResourceLink kind={BuildsReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-xs-3">
    {obj.metadata.namespace}
  </div>
  <div className="col-xs-3">
    {obj.status.phase}
  </div>
  <div className="col-xs-3">
    { fromNow(obj.metadata.creationTimestamp) }
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

/* eslint-disable no-undef */
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
/* eslint-enable no-undef */
