import * as React from 'react';
import * as _ from 'lodash-es';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { K8sResourceKind, K8sResourceKindReference, referenceFor } from '../module/k8s';
import { startBuild } from '../module/k8s/builds';
import { DetailsPage, ListPage, Table, TableRow, TableData, RowFunction } from './factory';
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
import {
  BuildsPage,
  BuildEnvironmentComponent,
  BuildStrategyType,
  PipelineBuildStrategyAlert,
} from './build';
import { fromNow } from './utils/datetime';
import { ResourceEventStream } from './events';

const BuildConfigsReference: K8sResourceKindReference = 'BuildConfig';

const startBuildAction: KebabAction = (kind, buildConfig) => ({
  label: 'Start Build',
  callback: () =>
    startBuild(buildConfig)
      .then((build) => {
        history.push(resourceObjPath(build, referenceFor(build)));
      })
      .catch((err) => {
        const error = err.message;
        errorModal({ error });
      }),
  accessReview: {
    group: kind.apiGroup,
    resource: kind.plural,
    subresource: 'instantiate',
    name: buildConfig.metadata.name,
    namespace: buildConfig.metadata.namespace,
    verb: 'create',
  },
});

const menuActions = [startBuildAction, ...Kebab.factory.common];

export const BuildConfigsDetails: React.SFC<BuildConfigsDetailsProps> = ({ obj: buildConfig }) => {
  const hasPipeline = buildConfig.spec.strategy.type === BuildStrategyType.JenkinsPipeline;

  return (
    <>
      <div className="co-m-pane__body">
        {hasPipeline && <PipelineBuildStrategyAlert obj={buildConfig} />}
        <SectionHeading text="Build Config Details" />
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
    </>
  );
};

const BuildsTabPage = ({ obj: buildConfig }) => (
  <BuildsPage
    namespace={buildConfig.metadata.namespace}
    showTitle={false}
    selector={{ 'openshift.io/build-config.name': buildConfig.metadata.name }}
  />
);

const pages = [
  navFactory.details(BuildConfigsDetails),
  navFactory.editYaml(),
  navFactory.builds(BuildsTabPage),
  navFactory.envEditor(BuildEnvironmentComponent),
  navFactory.events(ResourceEventStream),
];

export const BuildConfigsDetailsPage: React.SFC<BuildConfigsDetailsPageProps> = (props) => (
  <DetailsPage {...props} kind={BuildConfigsReference} menuActions={menuActions} pages={pages} />
);
BuildConfigsDetailsPage.displayName = 'BuildConfigsDetailsPage';

const tableColumnClasses = [
  classNames('col-sm-3', 'col-xs-6'),
  classNames('col-sm-3', 'col-xs-6'),
  classNames('col-sm-3', 'hidden-xs'),
  classNames('col-sm-3', 'hidden-xs'),
  Kebab.columnClass,
];

const BuildConfigsTableHeader = () => {
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
    },
    {
      title: 'Labels',
      sortField: 'metadata.labels',
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
BuildConfigsTableHeader.displayName = 'BuildConfigsTableHeader';

const BuildConfigsTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={BuildConfigsReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
          title={obj.metadata.name}
        />
      </TableData>
      <TableData className={classNames(tableColumnClasses[1], 'co-break-word')}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={BuildConfigsReference} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {fromNow(obj.metadata.creationTimestamp)}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={BuildConfigsReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const buildStrategy = (buildConfig: K8sResourceKind): BuildStrategyType =>
  buildConfig.spec.strategy.type;

const allStrategies = [
  BuildStrategyType.Docker,
  BuildStrategyType.JenkinsPipeline,
  BuildStrategyType.Source,
  BuildStrategyType.Custom,
];
const filters = [
  {
    filterGroupName: 'Build Strategy',
    type: 'build-strategy',
    reducer: buildStrategy,
    items: _.map(allStrategies, (strategy) => ({
      id: strategy,
      title: strategy,
    })),
  },
];

export const BuildConfigsList: React.SFC = (props) => (
  <Table
    {...props}
    aria-label="Build Configs"
    Header={BuildConfigsTableHeader}
    Row={BuildConfigsTableRow}
    virtualize
  />
);

BuildConfigsList.displayName = 'BuildConfigsList';

export const BuildConfigsPage: React.SFC<BuildConfigsPageProps> = (props) => (
  <ListPage
    {...props}
    title="Build Configs"
    kind={BuildConfigsReference}
    ListComponent={BuildConfigsList}
    canCreate={true}
    filterLabel={props.filterLabel}
    rowFilters={filters}
  />
);
BuildConfigsPage.displayName = 'BuildConfigsListPage';

export type BuildConfigsDetailsProps = {
  obj: K8sResourceKind;
};

export type BuildConfigsPageProps = {
  filterLabel?: string;
  mock?: boolean;
};

export type BuildConfigsDetailsPageProps = {
  match: any;
};
