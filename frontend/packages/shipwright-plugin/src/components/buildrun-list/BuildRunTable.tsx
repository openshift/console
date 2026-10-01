import type { FC } from 'react';
import { useMemo } from 'react';
import { SortByDirection } from '@patternfly/react-table';
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
import type { TableProps } from '@console/internal/components/factory/table';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { referenceFor } from '@console/internal/module/k8s';
import { LazyActionMenu } from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { BuildRunModel } from '../../models';
import type { BuildRun } from '../../types';
import BuildRunDuration, {
  getBuildRunDurationInSeconds,
} from '../buildrun-duration/BuildRunDuration';
import BuildRunStatus, { getBuildRunStatus } from '../buildrun-status/BuildRunStatus';
import type { BuildRunStatusFilters } from '../useBuildRunStatusFilter';
import { useBuildRunStatusFilter } from '../useBuildRunStatusFilter';

const useBuildRunColumns = (): {
  columns: ConsoleDataViewColumn<BuildRun>[];
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
        id: 'status',
        title: t('Status'),
        sort: (data, direction) => data.sort(sortResourceByValue(direction, getBuildRunStatus)),
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'started',
        title: t('Started'),
        sort: 'metadata.creationTimestamp',
        props: { modifier: 'nowrap' as const },
      },
      {
        id: 'duration',
        title: t('Duration'),
        sort: (data, direction) =>
          data.sort(sortResourceByValue(direction, getBuildRunDurationInSeconds)),
        props: { modifier: 'nowrap' as const },
      },
      { id: 'actions', title: '', props: actionsCellProps },
    ],
    [t],
  );
  return { columns };
};

export const getBuildRunDataViewRows: GetDataViewRows<BuildRun> = (data, columns) =>
  data.map(({ obj: buildRun }) => {
    const kindReference = referenceFor(buildRun);
    const rowCells = {
      name: {
        cell: (
          <ResourceLink
            kind={kindReference}
            name={buildRun.metadata.name}
            namespace={buildRun.metadata.namespace}
          />
        ),
        props: getNameCellProps(buildRun.metadata.name),
      },
      namespace: { cell: <ResourceLink kind="Namespace" name={buildRun.metadata.namespace} /> },
      status: { cell: <BuildRunStatus buildRun={buildRun} /> },
      started: { cell: <Timestamp timestamp={buildRun.metadata?.creationTimestamp} /> },
      duration: { cell: <BuildRunDuration buildRun={buildRun} /> },
      actions: {
        cell: <LazyActionMenu context={{ [kindReference]: buildRun }} />,
        props: actionsCellProps,
      },
    };
    return columns.map(({ id }) => ({ id, ...rowCells[id] }));
  });

export const BuildRunTable: FC<TableProps> = (props) => {
  const { t } = useTranslation('shipwright-plugin');
  const { columns } = useBuildRunColumns();
  const statusFilter = useBuildRunStatusFilter<BuildRun>(t('Status'), getBuildRunStatus);

  return (
    <ConsoleDataView<BuildRun, unknown, BuildRunStatusFilters>
      {...props}
      {...statusFilter}
      id={BuildRunModel}
      label={t('BuildRuns')}
      data={props.data}
      loaded={props.loaded}
      columns={columns}
      getDataViewRows={getBuildRunDataViewRows}
      defaultSortColumnId="started"
      defaultSortDirection={SortByDirection.desc}
    />
  );
};
