import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { match as Match } from 'react-router';
import * as classNames from 'classnames';
import { sortable } from '@patternfly/react-table';
import {
  K8sResourceKind,
  K8sResourceKindReference,
  referenceFor,
  referenceForModel,
} from '../module/k8s';
import { startBuild } from '../module/k8s/builds';
import { DetailsPage, ListPage, Table, TableData, RowFunctionArgs } from './factory';
import { errorModal } from './modals';
import {
  BuildHooks,
  BuildStrategy,
  history,
  Kebab,
  KebabAction,
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
import { BuildConfigModel, BuildModel } from '../models';
import Helmet from 'react-helmet';
import { useK8sWatchResource } from './utils/k8s-watch-hook';
import { Status } from '@console/shared';
import i18next from 'i18next';

const BuildConfigsReference: K8sResourceKindReference = 'BuildConfig';
const BuildsReference: K8sResourceKindReference = 'Build';

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
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  'pf-m-hidden pf-m-visible-on-lg',
  Kebab.columnClass,
];

const displayDurationInWords = (start: string, stop: string): string => {
  if (!start || !stop) {
    return '-';
  }
  const startTime = new Date(start).getTime();
  const stopTime = new Date(stop).getTime();
  let duration = (stopTime - startTime) / 1000;
  const time = [];
  let durationInWords = '';
  while (duration >= 60) {
    time.push(duration % 60);
    duration = Math.floor(duration / 60);
  }
  time.push(duration);
  if (time[2]) {
    durationInWords += `${time[2]} ${
      time[2] > 1 ? i18next.t('public~hours') : i18next.t('public~hour')
    } `;
  }
  if (time[1]) {
    durationInWords += `${time[1]} ${
      time[1] > 1 ? i18next.t('public~minutes') : i18next.t('public~minute')
    } `;
  }
  if (time[0]) {
    durationInWords += `${time[0]} ${
      time[0] > 1 ? i18next.t('public~seconds') : i18next.t('public~second')
    } `;
  }
  return durationInWords.trim();
};

const BuildConfigsTableRow: React.FC<RowFunctionArgs<K8sResourceKind, CustomData>> = ({
  obj,
  customData,
}) => {
  const latestBuild =
    customData.builds.latestByBuildName[`${obj.metadata.name}-${obj.metadata.namespace}`];

  const duration = displayDurationInWords(
    latestBuild?.status?.startTimestamp,
    latestBuild?.status?.completionTimestamp,
  );

  return (
    <>
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
        {latestBuild ? (
          <ResourceLink
            kind={BuildsReference}
            name={latestBuild.metadata?.name}
            namespace={latestBuild.metadata?.namespace}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData className={tableColumnClasses[3]}>
        {latestBuild ? <Status status={latestBuild.status?.phase} /> : '-'}
      </TableData>
      <TableData className={tableColumnClasses[4]}>
        {latestBuild ? <Timestamp timestamp={latestBuild.metadata?.creationTimestamp} /> : '-'}
      </TableData>
      <TableData className={tableColumnClasses[5]}>{latestBuild ? duration : '-'}</TableData>
      <TableData className={tableColumnClasses[6]}>
        <ResourceKebab actions={menuActions} kind={BuildConfigsReference} resource={obj} />
      </TableData>
    </>
  );
};

const isBuildNewerThen = (newBuild: K8sResourceKind, prevBuild: K8sResourceKind | undefined) => {
  const prevCreationTime = new Date(prevBuild?.metadata?.creationTimestamp);
  const newCreationTime = new Date(newBuild?.metadata?.creationTimestamp);
  const timeDifference = newCreationTime.getTime() - prevCreationTime.getTime();
  return timeDifference > 0;
};

const buildStrategy = (buildConfig: K8sResourceKind): BuildStrategyType =>
  buildConfig.spec.strategy.type;

export const BuildConfigsList: React.SFC<BuildConfigsListProps> = (props) => {
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
        title: t('public~Last run'),
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Last run status'),
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Last run time'),
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('public~Last run duration'),
        props: { className: tableColumnClasses[5] },
      },
      {
        title: '',
        props: { className: tableColumnClasses[6] },
      },
    ];
  };
  BuildConfigsTableHeader.displayName = 'BuildConfigsTableHeader';
  const buildModel = referenceForModel(BuildModel);
  const BUILDCONFIG_TO_BUILD_REFERENCE_LABEL = 'openshift.io/build-config.name';
  const [builds, buildsLoaded, buildsLoadError] = useK8sWatchResource<K8sResourceKind[]>({
    kind: buildModel,
    namespace: props.namespace,
    isList: true,
  });
  const customData = React.useMemo<CustomData>(
    () => ({
      builds: {
        latestByBuildName: builds.reduce<Record<string, K8sResourceKind>>((acc, build) => {
          const name = build.metadata.labels?.[BUILDCONFIG_TO_BUILD_REFERENCE_LABEL];
          if (
            !acc[`${name}-${build.metadata.namespace}`] ||
            isBuildNewerThen(build, acc[`${name}-${build.metadata.namespace}`])
          ) {
            acc[`${name}-${build.metadata.namespace}`] = build;
          }
          return acc;
        }, {}),
        loaded: buildsLoaded,
        error: buildsLoadError,
      },
    }),
    [builds, buildsLoaded, buildsLoadError],
  );
  return (
    <Table
      {...props}
      aria-label={t('public~BuildConfigs')}
      Header={BuildConfigsTableHeader}
      Row={BuildConfigsTableRow}
      customData={customData}
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

  const namespace = props.namespace ?? props.match?.params?.ns;
  const createProps = {
    to: `/k8s/ns/${namespace || 'default'}/buildconfigs/~new/form`,
  };

  return (
    <>
      <Helmet>
        <title>{t('public~BuildConfigs')}</title>
      </Helmet>
      <ListPage
        {...props}
        title={t('public~BuildConfigs')}
        kind={BuildConfigsReference}
        ListComponent={BuildConfigsList}
        canCreate={props.canCreate ?? true}
        createProps={createProps}
        filterLabel={props.filterLabel}
        rowFilters={filters}
      />
    </>
  );
};
BuildConfigsPage.displayName = 'BuildConfigsListPage';

type BuildConfigsListProps = {
  namespace: string;
};

export type BuildConfigsDetailsProps = {
  obj: K8sResourceKind;
};

export type BuildConfigsPageProps = {
  namespace: string;
  match?: Match<{ ns: string; name: string }>;
  canCreate?: boolean;
  filterLabel?: string;
  mock?: boolean;
};

export type BuildConfigsDetailsPageProps = {
  match: any;
};

type CustomData = {
  builds: {
    latestByBuildName: Record<string, K8sResourceKind>;
    loaded: boolean;
    error: Error | undefined;
  };
};
