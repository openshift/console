import * as React from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, redirect } from 'react-router-dom-v5-compat';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  K8sModel,
  K8sResourceKind,
  K8sResourceKindReference,
  referenceFor,
  referenceForModel,
  TableColumn,
} from '../module/k8s';
import { cloneBuild, startBuild } from '../module/k8s/builds';
import { DetailsPage, ListPage, DetailsPageProps } from './factory';
import {
  BuildHooks,
  BuildStrategy,
  Kebab,
  KebabAction,
  navFactory,
  ResourceLink,
  resourceObjPath,
  ResourceSummary,
  SectionHeading,
  WebhookTriggers,
} from './utils';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import {
  BuildsPage,
  BuildEnvironmentComponent,
  BuildStrategyType,
  PipelineBuildStrategyAlert,
} from './build';
import { ResourceEventStream } from './events';
import { BuildModel } from '../models';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { useK8sWatchResource } from './utils/k8s-watch-hook';
import { Status, DASH, LazyActionMenu } from '@console/shared';
import { displayDurationInWords } from './utils/build-utils';
import { Grid, GridItem } from '@patternfly/react-core';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import { ErrorModal } from './modals/error-modal';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ResourceDataView,
} from '@console/app/src/components/data-view/ResourceDataView';
import { GetDataViewRows } from '@console/app/src/components/data-view/types';
import { LoadingBox } from './utils/status-box';

import { getGroupVersionKindForModel } from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-ref';
import { sortResourceByValue } from './factory/Table/sort';
import { sorts } from './factory/table';
import { BuildConfigModel } from '../models';

const BuildConfigsReference: K8sResourceKindReference = 'BuildConfig';

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'lastRun' },
  { id: 'lastRunStatus' },
  { id: 'lastRunTime' },
  { id: 'lastRunDuration' },
  { id: 'actions' },
];

const getDataViewRows: GetDataViewRows<BuildConfig, undefined> = (data, columns) => {
  return data.map(({ obj: buildConfig }) => {
    const { name, namespace } = buildConfig.metadata;
    const latestBuild = buildConfig?.latestBuild;
    const resourceKind = referenceForModel(BuildConfigModel);
    const context = { [resourceKind]: buildConfig };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(BuildConfigModel)}
            name={name}
            namespace={namespace}
          />
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind="Namespace" name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: latestBuild ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(BuildModel)}
            name={latestBuild.metadata?.name}
            namespace={latestBuild.metadata?.namespace}
          />
        ) : (
          DASH
        ),
      },
      [tableColumnInfo[3].id]: {
        cell: latestBuild ? <Status status={latestBuild.status?.phase} /> : DASH,
      },
      [tableColumnInfo[4].id]: {
        cell: latestBuild ? (
          <Timestamp timestamp={latestBuild.metadata?.creationTimestamp} />
        ) : (
          DASH
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: displayDurationInWords(
          latestBuild?.status?.startTimestamp,
          latestBuild?.status?.completionTimestamp,
        ),
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={context} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        props: rowCells[id]?.props,
        cell,
      };
    });
  });
};

const useBuildConfigColumns = (): TableColumn<BuildConfig>[] => {
  const { t } = useTranslation();
  const columns = React.useMemo(() => {
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
        title: t('public~Last run'),
        id: tableColumnInfo[2].id,
        sort: 'latestBuild.metadata.name',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Last run status'),
        id: tableColumnInfo[3].id,
        sort: 'latestBuild.status.phase',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Last run time'),
        id: tableColumnInfo[4].id,
        sort: 'latestBuild.status.completionTimestamp',
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: t('public~Last run duration'),
        id: tableColumnInfo[5].id,
        sort: (data, direction) => data.sort(sortResourceByValue(direction, sorts.buildDuration)),
        props: {
          modifier: 'nowrap',
        },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: {
          ...cellIsStickyProps,
        },
      },
    ];
  }, [t]);
  return columns;
};

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

export const BuildConfigsList: React.FCC<BuildConfigsListProps> = ({ data, loaded, ...props }) => {
  const columns = useBuildConfigColumns();
  const buildModel = referenceForModel(BuildModel);
  const BUILDCONFIG_TO_BUILD_REFERENCE_LABEL = 'openshift.io/build-config.name';
  const [builds, buildsLoaded, buildsLoadError] = useK8sWatchResource<K8sResourceKind[]>({
    kind: buildModel,
    namespace: props.namespace,
    isList: true,
  });

  const buildData = React.useMemo<CustomData>(
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

  const buildResource = data
    ? data.map((buildConfig) => {
        buildConfig.latestBuild =
          buildData.builds.latestByBuildName[
            `${buildConfig.metadata.name}-${buildConfig.metadata.namespace}`
          ];
        return buildConfig;
      })
    : [];

  return (
    <React.Suspense fallback={<LoadingBox />}>
      <ResourceDataView
        {...props}
        label={BuildConfigModel.labelPlural}
        data={buildResource}
        loaded={loaded}
        columns={columns}
        initialFilters={initialFiltersDefault}
        getDataViewRows={getDataViewRows}
        hideColumnManagement={true}
      />
    </React.Suspense>
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
        omitFilterToolbar={true}
        hideColumnManagement={true}
      />
    </>
  );
};
BuildConfigsPage.displayName = 'BuildConfigsListPage';

type BuildConfigsListProps = {
  data: any[];
  loaded: boolean;
  namespace: string;
  [key: string]: any;
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
