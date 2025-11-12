import * as React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, redirect } from 'react-router-dom-v5-compat';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  K8sModel,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceFor,
  referenceForModel,
} from '../module/k8s';
import { cloneBuild, startBuild } from '../module/k8s/builds';
import {
  DetailsPage,
  ListPage,
  Table,
  TableData,
  RowFunctionArgs,
  TableProps,
  DetailsPageProps,
} from './factory';
import { BuildHooks } from './utils/build-hooks';
import { BuildStrategy } from './utils/build-strategy';
import { BuildStrategyType, displayDurationInWords } from './utils/build-utils';
import { Kebab, KebabAction, ResourceKebab } from './utils/kebab';
import { navFactory } from './utils/horizontal-nav';
import { ResourceLink, resourceObjPath } from './utils/resource-link';
import { ResourceSummary } from './utils/details-page';
import { SectionHeading } from './utils/headings';
import { WebhookTriggers } from './utils/webhooks';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { BuildsPage, BuildEnvironmentComponent, PipelineBuildStrategyAlert } from './build';
import { ResourceEventStream } from './events';
import { BuildModel } from '../models';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useK8sWatchResource } from './utils/k8s-watch-hook';
import { Status } from '@console/shared/src/components/status/Status';

import { Grid, GridItem } from '@patternfly/react-core';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ErrorModal } from './modals/error-modal';

const BuildConfigsReference: K8sResourceKindReference = 'BuildConfig';
const BuildsReference: K8sResourceKindReference = 'Build';

const useStartBuildAction = (): KebabAction => {
  const { t } = useTranslation();
  const launchModal = useOverlay();

  return useMemo(
    () => (kind: K8sModel, buildConfig: BuildConfig) => ({
      labelKey: t('public~Start build'),
      callback: () =>
        startBuild(buildConfig)
          .then((build) => {
            return redirect(resourceObjPath(build, referenceFor(build)));
          })
          .catch((err) => {
            const error = err.message;
            launchModal(ErrorModal, { error });
          }),
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        subresource: 'instantiate',
        name: buildConfig.metadata.name,
        namespace: buildConfig.metadata.namespace,
        verb: 'create',
      },
    }),
    [launchModal, t],
  );
};

const useStartLastBuildAction = (latestBuild: K8sResourceKind): KebabAction => {
  const { t } = useTranslation();
  const launchModal = useOverlay();

  return useMemo(
    () => (kind: K8sModel, buildConfig: BuildConfig) => ({
      labelKey: t('public~Start last run'),
      callback: () =>
        cloneBuild(latestBuild)
          .then((clone) => {
            return redirect(resourceObjPath(clone, referenceFor(clone)));
          })
          .catch((err) => {
            const error = err.message;
            launchModal(ErrorModal, { error });
          }),
      hidden: !latestBuild,
      accessReview: {
        group: kind.apiGroup,
        resource: kind.plural,
        subresource: 'instantiate',
        name: buildConfig.metadata.name,
        namespace: buildConfig.metadata.namespace,
        verb: 'create',
      },
    }),
    [latestBuild, launchModal, t],
  );
};

const useBuildConfigKebabActions = (latestBuild?: K8sResourceKind): KebabAction[] => {
  const startBuildAction = useStartBuildAction();
  const startLastBuildAction = useStartLastBuildAction(latestBuild);
  return useMemo(() => [startBuildAction, startLastBuildAction, ...Kebab.factory.common], [
    startBuildAction,
    startLastBuildAction,
  ]);
};

export const BuildConfigsDetails: React.FCC<BuildConfigsDetailsProps> = ({ obj: buildConfig }) => {
  const hasPipeline = buildConfig.spec.strategy.type === BuildStrategyType.JenkinsPipeline;
  const { t } = useTranslation();
  return (
    <>
      <PaneBody>
        {hasPipeline && <PipelineBuildStrategyAlert obj={buildConfig} />}
        <SectionHeading text={t('public~BuildConfig details')} />
        <Grid hasGutter>
          <GridItem sm={6}>
            <ResourceSummary resource={buildConfig} />
          </GridItem>
          <GridItem sm={6}>
            <BuildStrategy resource={buildConfig} />
          </GridItem>
        </Grid>
      </PaneBody>
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

const getLatestBuild = (builds) => {
  return builds.reduce((latestBuild, currentBuild) => {
    const latestBuildTime = new Date(latestBuild?.metadata?.creationTimestamp).getTime();
    const currentBuildTime = new Date(currentBuild.metadata.creationTimestamp).getTime();

    return currentBuildTime > latestBuildTime ? currentBuild : latestBuild;
  }, builds[0]);
};

export const BuildConfigsDetailsPage: React.FC<DetailsPageProps> = (props) => {
  const buildModel = referenceForModel(BuildModel);
  const [builds, buildsLoaded, buildsLoadError] = useK8sWatchResource<K8sResourceKind[]>({
    kind: buildModel,
    namespace: props.namespace,
    selector: {
      matchLabels: {
        'openshift.io/build-config.name': props.name,
      },
    },
    isList: true,
  });
  const latestBuild = buildsLoaded && !buildsLoadError ? getLatestBuild(builds) : null;
  const menuActions: KebabAction[] = useBuildConfigKebabActions(latestBuild);
  return (
    <DetailsPage
      {...props}
      kind={BuildConfigsReference}
      menuActions={menuActions}
      pages={pages}
      customData={latestBuild}
    />
  );
};
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

const BuildConfigsTableRow: React.FC<RowFunctionArgs<BuildConfig>> = ({ obj }) => {
  const latestBuild = obj?.latestBuild;
  const menuActions: KebabAction[] = useBuildConfigKebabActions(latestBuild);

  return (
    <>
      <TableData className={tableColumnClasses[0]}>
        <ResourceLink
          kind={BuildConfigsReference}
          name={obj.metadata.name}
          namespace={obj.metadata.namespace}
        />
      </TableData>
      <TableData className={css(tableColumnClasses[1], 'co-break-word')} columnID="namespace">
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
      <TableData className={tableColumnClasses[5]}>
        {displayDurationInWords(
          latestBuild?.status?.startTimestamp,
          latestBuild?.status?.completionTimestamp,
        )}
      </TableData>
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

const getBuildStatus = (buildConfig: BuildConfig) => {
  return buildConfig?.latestBuild?.status?.phase || 'Unknown';
};

export const BuildConfigsList: React.FCC<BuildConfigsListProps> = (props) => {
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
        transforms: [sortable],
        sortField: 'latestBuild.metadata.name',
        props: { className: tableColumnClasses[2] },
      },
      {
        title: t('public~Last run status'),
        transforms: [sortable],
        sortField: 'latestBuild.status.phase',
        props: { className: tableColumnClasses[3] },
      },
      {
        title: t('public~Last run time'),
        transforms: [sortable],
        sortField: 'latestBuild.status.completionTimestamp',
        props: { className: tableColumnClasses[4] },
      },
      {
        title: t('public~Last run duration'),
        transforms: [sortable],
        sortFunc: 'latestRunDuration',
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
  const data = React.useMemo<CustomData>(
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

  const buildResource = props.data
    ? props.data.map((buildConfig) => {
        buildConfig.latestBuild =
          data.builds.latestByBuildName[
            `${buildConfig.metadata.name}-${buildConfig.metadata.namespace}`
          ];
        return buildConfig;
      })
    : [];

  return (
    <Table
      {...props}
      data={buildResource}
      aria-label={t('public~BuildConfigs')}
      Header={BuildConfigsTableHeader}
      Row={BuildConfigsTableRow}
      customSorts={{
        latestRunDuration: (obj) =>
          displayDurationInWords(
            obj?.latestBuild?.status?.startTimestamp,
            obj?.latestBuild?.status?.completionTimestamp,
          ),
      }}
      virtualize
    />
  );
};

BuildConfigsList.displayName = 'BuildConfigsList';

export const BuildConfigsPage: React.FC<BuildConfigsPageProps> = (props) => {
  const { t } = useTranslation();
  const params = useParams();
  const allStrategies = [
    { id: BuildStrategyType.Docker, title: t('public~Docker') },
    { id: BuildStrategyType.Devfile, title: t('public~Devfile') },
    { id: BuildStrategyType.JenkinsPipeline, title: t('public~JenkinsPipeline') },
    { id: BuildStrategyType.Source, title: t('public~Source') },
    { id: BuildStrategyType.Custom, title: t('public~Custom') },
  ];

  const statusFilters = [
    { id: 'New', title: t('public~New') },
    { id: 'Pending', title: t('public~Pending') },
    { id: 'Running', title: t('public~Running') },
    { id: 'Complete', title: t('public~Complete') },
    { id: 'Failed', title: t('public~Failed') },
    { id: 'Error', title: t('public~Error') },
    { id: 'Cancelled', title: t('public~Cancelled') },
    { id: 'Unknown', title: t('public~Unknown') },
  ];

  const filters = [
    {
      filterGroupName: t('public~Build strategy'),
      type: 'build-strategy',
      reducer: buildStrategy,
      items: allStrategies,
    },
    {
      filterGroupName: t('public~Build status'),
      type: 'build-run-status',
      reducer: getBuildStatus,
      items: statusFilters,
      filter: (filterValue, build: BuildConfig): boolean => {
        const status = build?.latestBuild?.status?.phase ?? 'Unknown';
        return !filterValue.selected?.length || (status && filterValue.selected.includes(status));
      },
    },
  ];

  const namespace = props.namespace ?? params?.ns;
  const createProps = {
    to: `/k8s/ns/${namespace || 'default'}/buildconfigs/~new/form`,
  };

  return (
    <>
      <DocumentTitle>{t('public~BuildConfigs')}</DocumentTitle>
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

type BuildConfigsListProps = TableProps & {
  namespace: string;
};

export type BuildConfigsDetailsProps = {
  obj: K8sResourceKind;
};

export type BuildConfigsPageProps = {
  namespace: string;
  canCreate?: boolean;
  filterLabel?: string;
  mock?: boolean;
};

type CustomData = {
  builds: {
    latestByBuildName: Record<string, K8sResourceKind>;
    loaded: boolean;
    error: Error | undefined;
  };
};

type BuildConfig = K8sResourceKind & {
  latestBuild?: K8sResourceKind;
};
