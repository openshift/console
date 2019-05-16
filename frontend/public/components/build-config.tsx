import * as React from 'react';
import * as _ from 'lodash-es';

import { K8sResourceKind, K8sResourceKindReference, referenceFor } from '../module/k8s';
import { startBuild } from '../module/k8s/builds';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { errorModal } from './modals';
import {
  BuildHooks,
  BuildStrategy,
  history,
  Kebab,
  KebabAction,
  LabelList,
  navFactory,
  ResourceKebab,
  ResourceLink,
  resourceObjPath,
  ResourceSummary,
  SectionHeading,
  WebhookTriggers,
} from './utils';
import { BuildsPage, BuildEnvironmentComponent, BuildStrategyType } from './build';
import { fromNow } from './utils/datetime';
import { ResourceEventStream } from './events';

const BuildConfigsReference: K8sResourceKindReference = 'BuildConfig';

const { EditEnvironment, common } = Kebab.factory;

const startBuildAction: KebabAction = (kind, buildConfig) => ({
  label: 'Start Build',
  callback: () => startBuild(buildConfig).then(build => {
    history.push(resourceObjPath(build, referenceFor(build)));
  }).catch(err => {
    const error = err.message;
    errorModal({error});
  }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.path,
    subresource: 'instantiate',
    name: buildConfig.metadata.name,
    namespace: buildConfig.metadata.namespace,
    verb: 'create',
  },
});

const menuActions = [
  startBuildAction,
  EditEnvironment,
  ...common,
];

export const BuildConfigsDetails: React.SFC<BuildConfigsDetailsProps> = ({obj: buildConfig}) => <React.Fragment>
  <div className="co-m-pane__body">
    <SectionHeading text="Build Config Overview" />
    <div className="row">
      <div className="col-sm-6">
        <ResourceSummary resource={buildConfig} />
      </div>
      <div className="col-sm-6">
        <BuildStrategy resource={buildConfig} />
      </div>
    </div>
  </div>
  <WebhookTriggers resource={buildConfig} />
  <BuildHooks resource={buildConfig} />
</React.Fragment>;

const BuildsTabPage = ({obj: buildConfig}) => <BuildsPage namespace={buildConfig.metadata.namespace} showTitle={false} selector={{'openshift.io/build-config.name': buildConfig.metadata.name}} />;

const pages = [
  navFactory.details(BuildConfigsDetails),
  navFactory.editYaml(),
  navFactory.builds(BuildsTabPage),
  navFactory.envEditor(BuildEnvironmentComponent),
  navFactory.events(ResourceEventStream),
];

export const BuildConfigsDetailsPage: React.SFC<BuildConfigsDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={BuildConfigsReference}
    menuActions={menuActions}
    pages={pages} />;
BuildConfigsDetailsPage.displayName = 'BuildConfigsDetailsPage';

const BuildConfigsHeader = props => <ListHeader>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-sm-3 col-xs-6" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-sm-3 hidden-xs" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-sm-3 hidden-xs" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const BuildConfigsRow: React.SFC<BuildConfigsRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-sm-3 col-xs-6">
    <ResourceLink kind={BuildConfigsReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-sm-3 col-xs-6 co-break-word">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
  </div>
  <div className="col-sm-3 hidden-xs">
    <LabelList kind={BuildConfigsReference} labels={obj.metadata.labels} />
  </div>
  <div className="col-sm-3 hidden-xs">
    { fromNow(obj.metadata.creationTimestamp) }
  </div>
  <div className="dropdown-kebab-pf">
    <ResourceKebab actions={menuActions} kind={BuildConfigsReference} resource={obj} />
  </div>
</div>;

const buildStrategy = (buildConfig: K8sResourceKind): BuildStrategyType => buildConfig.spec.strategy.type;

const allStrategies = [BuildStrategyType.Docker, BuildStrategyType.JenkinsPipeline, BuildStrategyType.Source, BuildStrategyType.Custom];
const filters = [{
  type: 'build-strategy',
  selected: allStrategies,
  reducer: buildStrategy,
  items: _.map(allStrategies, strategy => ({
    id: strategy,
    title: strategy,
  })),
}];

export const BuildConfigsList: React.SFC = props => <List {...props} Header={BuildConfigsHeader} Row={BuildConfigsRow} />;
BuildConfigsList.displayName = 'BuildConfigsList';

export const BuildConfigsPage: React.SFC<BuildConfigsPageProps> = props =>
  <ListPage
    {...props}
    title="Build Configs"
    kind={BuildConfigsReference}
    ListComponent={BuildConfigsList}
    canCreate={true}
    filterLabel={props.filterLabel}
    rowFilters={filters} />;
BuildConfigsPage.displayName = 'BuildConfigsListPage';

export type BuildConfigsRowProps = {
  obj: any;
};

export type BuildConfigsDetailsProps = {
  obj: any;
};

export type BuildConfigsPageProps = {
  filterLabel: string;
};

export type BuildConfigsDetailsPageProps = {
  match: any;
};
