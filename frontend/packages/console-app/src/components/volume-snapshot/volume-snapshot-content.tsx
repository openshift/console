import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import type { GetDataViewRows } from '@console/app/src/components/data-view/types';
import type { TableColumn } from '@console/dynamic-plugin-sdk/src/lib-core';
import {
  ListPageBody,
  ListPageCreate,
  ListPageHeader,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import type { PageComponentProps } from '@console/internal/components/utils/horizontal-nav';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { humanizeBinaryBytes } from '@console/internal/components/utils/units';
import {
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  VolumeSnapshotContentModel,
} from '@console/internal/models';
import type { VolumeSnapshotContentKind } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { Status } from '@console/shared/src/components/status/Status';
import { DASH } from '@console/shared/src/constants/ui';
import { volumeSnapshotStatus } from '../../status';

const kind = referenceForModel(VolumeSnapshotContentModel);

export const tableColumnInfo = [
  { id: 'name' },
  { id: 'status' },
  { id: 'size' },
  { id: 'volumeSnapshot' },
  { id: 'snapshotClass' },
  { id: 'createdAt' },
  { id: '' },
];

const getDataViewRows: GetDataViewRows<VolumeSnapshotContentKind> = (data, columns) => {
  return data.map(({ obj }) => {
    const name = obj.metadata?.name || '';
    const creationTimestamp = obj.metadata?.creationTimestamp || '';
    const snapshotName = obj.spec?.volumeSnapshotRef?.name || '';
    const snapshotNamespace = obj.spec?.volumeSnapshotRef?.namespace || '';
    const size = obj.status?.restoreSize;
    const sizeMetrics = size ? humanizeBinaryBytes(size).string : DASH;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kind} name={name} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <Status status={volumeSnapshotStatus(obj)} />,
      },
      [tableColumnInfo[2].id]: {
        cell: sizeMetrics,
      },
      [tableColumnInfo[3].id]: {
        cell: (
          <ResourceLink
            kind={referenceForModel(VolumeSnapshotModel)}
            name={snapshotName}
            namespace={snapshotNamespace}
          />
        ),
      },
      [tableColumnInfo[4].id]: {
        cell: (
          <ResourceLink
            kind={referenceForModel(VolumeSnapshotClassModel)}
            name={obj.spec?.volumeSnapshotClassName}
          />
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
      [tableColumnInfo[6].id]: {
        cell: <LazyActionMenu context={{ [kind]: obj }} />,
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell || DASH;
      const props = rowCells[id]?.props || undefined;
      return {
        id,
        props,
        cell,
      };
    });
  });
};

const useVolumeSnapshotContentColumns = (): TableColumn<VolumeSnapshotContentKind>[] => {
  const { t } = useTranslation();

  const columns: TableColumn<VolumeSnapshotContentKind>[] = useMemo(
    () => [
      {
        title: t('console-app~Name'),
        sort: 'metadata.name',
        id: tableColumnInfo[0].id,
        props: { ...cellIsStickyProps, modifier: 'nowrap' },
      },
      {
        title: t('console-app~Status'),
        sort: 'snapshotStatus',
        id: tableColumnInfo[1].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('console-app~Size'),
        sort: 'volumeSnapshotSize',
        id: tableColumnInfo[2].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('console-app~VolumeSnapshot'),
        sort: 'spec.volumeSnapshotRef.name',
        id: tableColumnInfo[3].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('console-app~SnapshotClass'),
        sort: 'spec.volumeSnapshotClassName',
        id: tableColumnInfo[4].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('console-app~Created at'),
        sort: 'metadata.creationTimestamp',
        id: tableColumnInfo[5].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: '',
        id: tableColumnInfo[6].id,
        props: { ...cellIsStickyProps },
      },
    ],
    [t],
  );

  return columns;
};

const VolumeSnapshotContentTable: FC<VolumeSnapshotContentTableProps> = ({
  data,
  loaded,
  ...props
}) => {
  const columns = useVolumeSnapshotContentColumns();

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<VolumeSnapshotContentKind>
        {...props}
        label={VolumeSnapshotContentModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
      />
    </Suspense>
  );
};

const VolumeSnapshotContentPage: FC<VolumeSnapshotContentPageProps> = ({
  showTitle = true,
  canCreate = true,
}) => {
  const { t } = useTranslation();

  const [resources, loaded, loadError] = useK8sWatchResource<VolumeSnapshotContentKind[]>({
    groupVersionKind: {
      group: VolumeSnapshotContentModel.apiGroup,
      kind: VolumeSnapshotContentModel.kind,
      version: VolumeSnapshotContentModel.apiVersion,
    },
    isList: true,
  });

  return (
    <>
      <ListPageHeader title={showTitle ? t(VolumeSnapshotContentModel.labelPluralKey || '') : ''}>
        {canCreate && (
          <ListPageCreate groupVersionKind={kind}>
            {t('console-app~Create VolumeSnapshotContent')}
          </ListPageCreate>
        )}
      </ListPageHeader>
      <ListPageBody>
        <VolumeSnapshotContentTable data={resources} loaded={loaded} loadError={loadError} />
      </ListPageBody>
    </>
  );
};

type VolumeSnapshotContentPageProps = {
  canCreate?: boolean;
} & PageComponentProps;

type VolumeSnapshotContentTableProps = {
  data: VolumeSnapshotContentKind[];
  loaded: boolean;
  loadError: unknown;
};

export default VolumeSnapshotContentPage;
