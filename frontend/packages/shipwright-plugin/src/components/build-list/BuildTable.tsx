import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ConsoleDataView,
  actionsCellProps,
  getNameCellProps,
  getNameColumnProps,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { useFlag } from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/utils/k8s/hooks/useK8sWatchResource';
import type { TableProps } from '@console/internal/components/factory/table';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { BUILDRUN_TO_BUILD_REFERENCE_LABEL } from '../../const';
import { BuildModel, BuildRunModel, BuildRunModelV1Alpha1 } from '../../models';
import type { Build, BuildRun } from '../../types';
import { isBuildRunNewerThen, isV1Alpha1Resource } from '../../utils';
import BuildRunDuration, { getBuildRunDuration } from '../buildrun-duration/BuildRunDuration';
import BuildRunStatus, { getBuildRunStatus } from '../buildrun-status/BuildRunStatus';
import type { BuildRunStatusFilters } from '../useBuildRunStatusFilter';
import { useBuildRunStatusFilter } from '../useBuildRunStatusFilter';
import BuildOutput from './BuildOutput';

const useBuildColumns = (): {
  columns: ConsoleDataViewColumn<Build>[];
} => {
  const { t } = useTranslation('shipwright-plugin');
  const columns = useMemo(
    () => [
      {
        id: 'name',
        title: t('Name'),
        sort: 'metadata.name',
        props: { ...getNameColumnProps(), modifier: 'nowrap' as const },
      },
      {
        id: 'namespace',
        title: t('Namespace'),
        sort: 'metadata.namespace',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'output',
        title: t('Output'),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'lastRun',
        title: t('Last run'),
        sort: 'latestBuild.metadata.name',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'lastRunStatus',
        title: t('Last run status'),
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue(direction, (obj: Build) => getBuildRunStatus(obj.latestBuild)),
          ),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'lastRunTime',
        title: t('Last run time'),
        // Sorts on the timestamp the cell renders. Sorting on status.completionTime ordered the
        // column by a value that is not shown, and that a still-running BuildRun does not have.
        sort: 'latestBuild.metadata.creationTimestamp',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'lastRunDuration',
        title: t('Last run duration'),
        sort: (data, direction) =>
          data.sort(
            sortResourceByValue(direction, (obj: Build) => getBuildRunDuration(obj.latestBuild)),
          ),
        props: { modifier: 'nowrap' as const },
      },
      { id: 'actions', title: '', props: actionsCellProps },
    ],
    [t],
  );
  return { columns };
};

export const getBuildDataViewRows: GetDataViewRows<Build> = (data, columns) =>
  data.map(({ obj: build }) => {
    const kindReference = referenceFor(build);
    const buildRunKindReference = isV1Alpha1Resource(build)
      ? referenceForModel(BuildRunModelV1Alpha1)
      : referenceForModel(BuildRunModel);
    const rowCells = {
      name: {
        cell: (
          <ResourceLink
            kind={kindReference}
            name={build.metadata.name}
            namespace={build.metadata.namespace}
          />
        ),
        props: getNameCellProps(build.metadata.name),
      },
      namespace: { cell: <ResourceLink kind="Namespace" name={build.metadata.namespace} /> },
      output: {
        cell: <BuildOutput buildSpec={build.spec} />,
        // Both of these render a ResourceLink. Without nowrap on the cell itself the resource
        // name breaks one character per line whenever the column is narrow.
        props: { modifier: 'nowrap' as const },
      },
      lastRun: {
        cell: build.latestBuild ? (
          <ResourceLink
            kind={buildRunKindReference}
            name={build.latestBuild.metadata?.name}
            namespace={build.latestBuild.metadata?.namespace}
          />
        ) : (
          '-'
        ),
        props: { modifier: 'nowrap' as const },
      },
      lastRunStatus: {
        cell: build.latestBuild ? <BuildRunStatus buildRun={build.latestBuild} /> : '-',
      },
      lastRunTime: {
        cell: build.latestBuild ? (
          <Timestamp timestamp={build.latestBuild.metadata?.creationTimestamp} />
        ) : (
          '-'
        ),
      },
      lastRunDuration: {
        cell: build.latestBuild ? <BuildRunDuration buildRun={build.latestBuild} /> : '-',
      },
      actions: {
        cell: <LazyActionMenu context={{ [kindReference]: build }} />,
        props: actionsCellProps,
      },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

type BuildTableProps = TableProps & {
  namespace: string;
  data: Build[];
};

export const BuildTable: FC<BuildTableProps> = (props) => {
  const { t } = useTranslation('shipwright-plugin');
  const { columns } = useBuildColumns();
  const buildRunModel = useFlag('SHIPWRIGHT_BUILDRUN')
    ? referenceForModel(BuildRunModel)
    : referenceForModel(BuildRunModelV1Alpha1);

  const [buildRuns] = useK8sWatchResource<BuildRun[]>({
    kind: buildRunModel,
    namespace: props.namespace,
    isList: true,
  });

  const latestByBuildName = useMemo(
    () =>
      buildRuns.reduce<Record<string, BuildRun>>((acc, buildRun) => {
        const name = buildRun.metadata.labels?.[BUILDRUN_TO_BUILD_REFERENCE_LABEL];
        const key = `${name}-${buildRun.metadata.namespace}`;
        if (!acc[key] || isBuildRunNewerThen(buildRun, acc[key])) {
          acc[key] = buildRun;
        }
        return acc;
      }, {}),
    [buildRuns],
  );

  const data = useMemo(
    () =>
      props.data?.map((build) => ({
        ...build,
        latestBuild: latestByBuildName[`${build.metadata.name}-${build.metadata.namespace}`],
      })),
    [props.data, latestByBuildName],
  );

  const getStatus = useCallback((build: Build) => getBuildRunStatus(build.latestBuild), []);
  const statusFilter = useBuildRunStatusFilter<Build>(t('BuildRun status'), getStatus);

  return (
    <ConsoleDataView<Build, unknown, BuildRunStatusFilters>
      {...props}
      {...statusFilter}
      id={BuildModel}
      label={t('Builds')}
      data={data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getBuildDataViewRows}
    />
  );
};
