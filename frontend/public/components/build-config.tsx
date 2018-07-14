import * as React from 'react';
import * as _ from 'lodash-es';

// eslint-disable-next-line no-unused-vars
import { K8sResourceKindReference, referenceFor } from '../module/k8s';
import { startBuild } from '../module/k8s/builds';
import { ColHead, DetailsPage, List, ListHeader, ListPage } from './factory';
import { errorModal } from './modals';
import { BuildHooks, BuildStrategy, Cog, LabelList, history, navFactory, ResourceCog, ResourceLink, resourceObjPath, ResourceSummary, WebhookTriggers } from './utils';
import { BuildsPage, BuildEnvironmentComponent } from './build';
import { fromNow } from './utils/datetime';
import { registerTemplate } from '../yaml-templates';

// Pushes to the image stream created by the image stream YAML template.
registerTemplate('build.openshift.io/v1.BuildConfig', `apiVersion: build.openshift.io/v1
kind: BuildConfig
metadata:
  name: example
spec:
  output:
    to:
      kind: ImageStreamTag
      name: example:latest
  source:
    git:
      ref: master
      uri: https://github.com/openshift/ruby-ex.git
    type: Git
  strategy:
    type: Source
    sourceStrategy:
      from:
        kind: ImageStreamTag
        name: ruby:2.4
        namespace: openshift
      env: []
  triggers:
  - type: ImageChange
    imageChange: {}
  - type: ConfigChange`);

const BuildConfigsReference: K8sResourceKindReference = 'BuildConfig';

const { EditEnvironment, common } = Cog.factory;

const startBuildAction = (kind, buildConfig) => ({
  label: 'Start Build',
  callback: () => startBuild(buildConfig).then(build => {
    history.push(resourceObjPath(build, referenceFor(build)));
  }).catch(err => {
    const error = err.message;
    errorModal({error});
  }),
});

const menuActions = [
  startBuildAction,
  EditEnvironment,
  ...common,
];

export const BuildConfigsDetails: React.SFC<BuildConfigsDetailsProps> = ({obj: buildConfig}) => <React.Fragment>
  <div className="co-m-pane__body">
    <h1 className="co-m-pane__heading">Build Config Overview</h1>
    <div className="row">
      <div className="col-sm-6">
        <ResourceSummary resource={buildConfig} showPodSelector={false} showNodeSelector={false} />
      </div>
      <div className="col-sm-6">
        <BuildStrategy resource={buildConfig} />
      </div>
    </div>
  </div>
  <WebhookTriggers resource={buildConfig} />
  <BuildHooks resource={buildConfig} />
</React.Fragment>;

const BuildsTabPage = ({obj: buildConfig}) => <BuildsPage namespace={buildConfig.metadata.namespace} showTitle={false} selector={{ 'openshift.io/build-config.name': buildConfig.metadata.name}} />;

const pages = [navFactory.details(BuildConfigsDetails), navFactory.editYaml(), navFactory.envEditor(BuildEnvironmentComponent), navFactory.builds(BuildsTabPage)];
export const BuildConfigsDetailsPage: React.SFC<BuildConfigsDetailsPageProps> = props =>
  <DetailsPage
    {...props}
    kind={BuildConfigsReference}
    menuActions={menuActions}
    pages={pages} />;
BuildConfigsDetailsPage.displayName = 'BuildConfigsDetailsPage';

const BuildConfigsHeader = props => <ListHeader>
  <ColHead {...props} className="col-xs-3" sortField="metadata.name">Name</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.namespace">Namespace</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.labels">Labels</ColHead>
  <ColHead {...props} className="col-xs-3" sortField="metadata.creationTimestamp">Created</ColHead>
</ListHeader>;

const BuildConfigsRow: React.SFC<BuildConfigsRowProps> = ({obj}) => <div className="row co-resource-list__item">
  <div className="col-xs-3 co-break-word">
    <ResourceCog actions={menuActions} kind={BuildConfigsReference} resource={obj} />
    <ResourceLink kind={BuildConfigsReference} name={obj.metadata.name} namespace={obj.metadata.namespace} title={obj.metadata.name} />
  </div>
  <div className="col-xs-3 co-break-word">
    <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
  </div>
  <div className="col-xs-3">
    <LabelList kind={BuildConfigsReference} labels={obj.metadata.labels} />
  </div>
  <div className="col-xs-3">
    { fromNow(obj.metadata.creationTimestamp) }
  </div>
</div>;

const buildStrategy = buildConfig => buildConfig.spec.strategy.type;

const allStrategies = ['Docker', 'JenkinsPipeline', 'Source', 'Custom'];
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

/* eslint-disable no-undef */
export type BuildConfigsRowProps = {
  obj: any,
};

export type BuildConfigsDetailsProps = {
  obj: any,
};

export type BuildConfigsPageProps = {
  filterLabel: string,
};

export type BuildConfigsDetailsPageProps = {
  match: any,
};
/* eslint-enable no-undef */
