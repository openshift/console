import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  ListPageBody,
  ListPageCreate,
  ListPageHeader,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import type { PageComponentProps } from '@console/internal/components/utils/horizontal-nav';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import {
  VolumeGroupSnapshotModel,
  VolumeGroupSnapshotClassModel,
  VolumeGroupSnapshotContentModel,
} from '@console/internal/models';
import type { VolumeGroupSnapshotContentKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { Status } from '@console/shared/src/components/status/Status';
import { DASH } from '@console/shared/src/constants/ui';
import { groupSnapshotStatus } from '@console/shared/src/sorts/snapshot';

const kind = referenceForModel(VolumeGroupSnapshotContentModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'status' },
  { id: 'volumeGroupSnapshot' },
  { id: 'snapshotClass' },
  { id: 'createdAt' },
  { id: '' },
];

const getDataViewRows: GetDataViewRows<VolumeGroupSnapshotContentKind> = (data, columns) =>
  data.map(({ obj }) => {
    const name = obj.metadata?.name || '';
    const creationTimestamp = obj.metadata?.creationTimestamp || '';
    const snapshotName = obj.spec?.volumeGroupSnapshotRef?.name || '';
    const snapshotNamespace = obj.spec?.volumeGroupSnapshotRef?.namespace || '';

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kind} name={name} />,
      },
      [tableColumnInfo[1].id]: {
        cell: <Status status={groupSnapshotStatus(obj)} />,
      },
      [tableColumnInfo[2].id]: {
        cell: (
          <ResourceLink
            kind={referenceForModel(VolumeGroupSnapshotModel)}
            name={snapshotName}
            namespace={snapshotNamespace}
          />
        ),
      },
      [tableColumnInfo[3].id]: {
        cell: (
          <ResourceLink
            kind={referenceForModel(VolumeGroupSnapshotClassModel)}
            name={obj.spec?.volumeGroupSnapshotClassName}
          />
        ),
      },
      [tableColumnInfo[4].id]: {
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
    };

    return columns.map(({ id }) => {
      if (id === tableColumnInfo[5].id) return { id };
      const cell = rowCells[id]?.cell || DASH;
      return {
        id,
        cell,
      };
    });
  });

const useVolumeGroupSnapshotContentColumns = (): {
  columns: ConsoleDataViewColumn<VolumeGroupSnapshotContentKind>[];
} => {
  const { t } = useTranslation('console-app');

  const columns: ConsoleDataViewColumn<VolumeGroupSnapshotContentKind>[] = useMemo(
    () => [
      {
        type: 'name' as const,
        id: tableColumnInfo[0].id,
      },
      {
        title: t('Status'),
        sort: (data, direction) => data.sort(sortResourceByValue(direction, groupSnapshotStatus)),
        id: tableColumnInfo[1].id,
        props: { modifier: 'nowrap' as const },
      },
      {
        title: t('VolumeGroupSnapshot'),
        sort: 'spec.volumeGroupSnapshotRef.name',
        id: tableColumnInfo[2].id,
        props: { modifier: 'nowrap' as const },
      },
      {
        title: t('SnapshotClass'),
        sort: 'spec.volumeGroupSnapshotClassName',
        id: tableColumnInfo[3].id,
        props: { modifier: 'nowrap' as const },
      },
      {
        title: t('Created at'),
        sort: 'metadata.creationTimestamp',
        id: tableColumnInfo[4].id,
        props: { modifier: 'nowrap' as const },
      },
      { type: 'actions' as const, id: tableColumnInfo[5].id },
    ],
    [t],
  );

  return { columns };
};

const VolumeGroupSnapshotContentTable: FC<VolumeGroupSnapshotContentTableProps> = ({
  data,
  loaded,
  ...props
}) => {
  const { columns } = useVolumeGroupSnapshotContentColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<VolumeGroupSnapshotContentKind>
        {...props}
        id={VolumeGroupSnapshotContentModel}
        label={VolumeGroupSnapshotContentModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
      />
    </Suspense>
  );
};

const VolumeGroupSnapshotContentPage: FC<VolumeGroupSnapshotContentPageProps> = ({
  showTitle = true,
  canCreate = true,
}) => {
  const { t } = useTranslation('console-app');

  const [resources, loaded, loadError] = useK8sWatchResource<VolumeGroupSnapshotContentKind[]>({
    groupVersionKind: {
      group: VolumeGroupSnapshotContentModel.apiGroup,
      kind: VolumeGroupSnapshotContentModel.kind,
      version: VolumeGroupSnapshotContentModel.apiVersion,
    },
    isList: true,
  });

  return (
    <>
      <ListPageHeader
        title={showTitle ? t(VolumeGroupSnapshotContentModel.labelPluralKey || '') : ''}
      >
        {canCreate && (
          <ListPageCreate groupVersionKind={kind}>
            {t('Create VolumeGroupSnapshotContent')}
          </ListPageCreate>
        )}
      </ListPageHeader>
      <ListPageBody>
        <VolumeGroupSnapshotContentTable data={resources} loaded={loaded} loadError={loadError} />
      </ListPageBody>
    </>
  );
};

type VolumeGroupSnapshotContentPageProps = {
  canCreate?: boolean;
} & PageComponentProps;

type VolumeGroupSnapshotContentTableProps = {
  data: VolumeGroupSnapshotContentKind[];
  loaded: boolean;
  loadError: unknown;
};

export default VolumeGroupSnapshotContentPage;
