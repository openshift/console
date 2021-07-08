import * as React from 'react';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
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
  Timestamp,
  WebhookTriggers,
} from './utils';
import {
  BuildsPage,
  BuildEnvironmentComponent,
  BuildStrategyType,
  PipelineBuildStrategyAlert,
} from './build';
import { ResourceEventStream } from './events';
import { BuildConfigModel } from '../models';

const BuildConfigsReference: K8sResourceKindReference = 'BuildConfig';

const startBuildAction: KebabAction = (kind, buildConfig) => ({
  // t('public~Start build')
  labelKey: 'public~Start build',
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

const menuActions = [
  startBuildAction,
  ...Kebab.getExtensionsActionsForKind(BuildConfigModel),
  ...Kebab.factory.common,
];

export const BuildConfigsDetails: React.SFC<BuildConfigsDetailsProps> = ({ obj: buildConfig }) => {
  const hasPipeline = buildConfig.spec.strategy.type === BuildStrategyType.JenkinsPipeline;
  const { t } = useTranslation();
  return (
    <>
      <div className="co-m-pane__body">
        {hasPipeline && <PipelineBuildStrategyAlert obj={buildConfig} />}
        <SectionHeading text={t('public~BuildConfig details')} />
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
  '',
  '',
  'pf-m-hidden pf-m-visible-on-md',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const BuildConfigsTableRow: RowFunction<K8sResourceKind> = ({ obj, index, key, style }) => {
  return (
    <TableRow id={obj.metadata.uid} index={index} trKey={key} style={style}>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={BuildConfigsReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData
        className={classNames(tableColumnClasses[1], 'co-break-word')}
        columnID="namespace"
      >
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
      <TableData className={tableColumnClasses[2]}>
        <LabelList kind={BuildConfigsReference} labels={obj.metadata.labels} />
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        <Timestamp timestamp={obj.metadata.creationTimestamp} />
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        <ResourceKebab actions={menuActions} kind={BuildConfigsReference} resource={obj} />
      </TableData>
    </TableRow>
  );
};

const buildStrategy = (buildConfig: K8sResourceKind): BuildStrategyType =>
  buildConfig.spec.strategy.type;

export const BuildConfigsList: React.SFC = (props) => {
  const { t } = useTranslation();
  const BuildConfigsTableHeader = () => {
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
        title: t('public~Labels'),
        sortField: 'metadata.labels',
        transforms: [sortable],
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Created'),
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

  return (
    <Table
      {...props}
      aria-label={t('public~BuildConfigs')}
      Header={BuildConfigsTableHeader}
      Row={BuildConfigsTableRow}
      virtualize
    />
  );
};

BuildConfigsList.displayName = 'BuildConfigsList';

export const BuildConfigsPage: React.FC<BuildConfigsPageProps> = (props) => {
  const { t } = useTranslation();
  const allStrategies = [
    { id: BuildStrategyType.Docker, title: t('public~Docker') },
    { id: BuildStrategyType.Devfile, title: t('public~Devfile') },
    { id: BuildStrategyType.JenkinsPipeline, title: t('public~JenkinsPipeline') },
    { id: BuildStrategyType.Source, title: t('public~Source') },
    { id: BuildStrategyType.Custom, title: t('public~Custom') },
  ];

  const filters = [
    {
      filterGroupName: t('public~Build strategy'),
      type: 'build-strategy',
      reducer: buildStrategy,
      items: allStrategies,
    },
  ];
  return (
    <ListPage
      {...props}
      title={t('public~BuildConfigs')}
      kind={BuildConfigsReference}
      ListComponent={BuildConfigsList}
      canCreate={true}
      filterLabel={props.filterLabel}
      rowFilters={filters}
    />
  );
};
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
