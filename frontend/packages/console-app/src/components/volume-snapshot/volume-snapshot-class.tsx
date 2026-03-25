import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import type { TFunction } from 'i18next';
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
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { VolumeSnapshotClassModel } from '@console/internal/models';
import type { VolumeSnapshotClassKind, Selector } from '@console/internal/module/k8s';
import { referenceForModel, referenceFor } from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { DASH } from '@console/shared/src/constants/ui';
import { getAnnotations } from '@console/shared/src/selectors/common';

const kind = referenceForModel(VolumeSnapshotClassModel);

const tableColumnInfo = [{ id: 'name' }, { id: 'driver' }, { id: 'deletionPolicy' }, { id: '' }];

const defaultSnapshotClassAnnotation = 'snapshot.storage.kubernetes.io/is-default-class';

export const isDefaultSnapshotClass = (volumeSnapshotClass: VolumeSnapshotClassKind) =>
  getAnnotations(volumeSnapshotClass, { defaultSnapshotClassAnnotation: 'false' })[
    defaultSnapshotClassAnnotation
  ] === 'true';

const getDataViewRowsCreator: (t: TFunction) => GetDataViewRows<VolumeSnapshotClassKind> = (t) => (
  data,
  columns,
) => {
  return data.map(({ obj }) => {
    const name = obj.metadata?.name || '';
    const { deletionPolicy, driver } = obj;
    const context = { [referenceFor(obj)]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink name={name} kind={kind}>
            {isDefaultSnapshotClass(obj) && (
              <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle co-resource-item__help-text">
                &ndash; {t('console-app~Default')}
              </span>
            )}
          </ResourceLink>
        ),
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: driver,
      },
      [tableColumnInfo[2].id]: {
        cell: deletionPolicy,
      },
      [tableColumnInfo[3].id]: {
        cell: <LazyActionMenu context={context} />,
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

const useVolumeSnapshotClassColumns = (): TableColumn<VolumeSnapshotClassKind>[] => {
  const { t } = useTranslation();

  const columns: TableColumn<VolumeSnapshotClassKind>[] = useMemo(
    () => [
      {
        title: t('console-app~Name'),
        sort: 'metadata.name',
        id: tableColumnInfo[0].id,
        props: { ...cellIsStickyProps, modifier: 'nowrap' },
      },
      {
        title: t('console-app~Driver'),
        sort: 'driver',
        id: tableColumnInfo[1].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: t('console-app~Deletion policy'),
        sort: 'deletionPolicy',
        id: tableColumnInfo[2].id,
        props: { modifier: 'nowrap' },
      },
      {
        title: '',
        id: tableColumnInfo[3].id,
        props: { ...cellIsStickyProps },
      },
    ],
    [t],
  );

  return columns;
};

const VolumeSnapshotClassTable: FC<VolumeSnapshotClassTableProps> = ({
  data,
  loaded,
  ...props
}) => {
  const { t } = useTranslation();
  const columns = useVolumeSnapshotClassColumns();
  const getDataViewRows = useMemo(() => getDataViewRowsCreator(t), [t]);

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<VolumeSnapshotClassKind>
        {...props}
        label={VolumeSnapshotClassModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        hideColumnManagement
      />
    </Suspense>
  );
};

export const VolumeSnapshotClassPage: FC<VolumeSnapshotClassPageProps> = ({
  canCreate = true,
  showTitle = true,
  namespace,
  selector,
}) => {
  const { t } = useTranslation();

  const [resources, loaded, loadError] = useK8sWatchResource<VolumeSnapshotClassKind[]>({
    groupVersionKind: {
      group: VolumeSnapshotClassModel.apiGroup,
      kind: VolumeSnapshotClassModel.kind,
      version: VolumeSnapshotClassModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
    selector,
  });

  return (
    <>
      <ListPageHeader title={showTitle ? t(VolumeSnapshotClassModel.labelPluralKey || '') : ''}>
        {canCreate && (
          <ListPageCreate groupVersionKind={kind}>
            {t('console-app~Create VolumeSnapshotClass')}
          </ListPageCreate>
        )}
      </ListPageHeader>
      <ListPageBody>
        <VolumeSnapshotClassTable data={resources} loaded={loaded} loadError={loadError} />
      </ListPageBody>
    </>
  );
};

type VolumeSnapshotClassPageProps = {
  namespace?: string;
  canCreate?: boolean;
  showTitle?: boolean;
  selector?: Selector;
};

type VolumeSnapshotClassTableProps = {
  data: VolumeSnapshotClassKind[];
  loaded: boolean;
  loadError: unknown;
};
