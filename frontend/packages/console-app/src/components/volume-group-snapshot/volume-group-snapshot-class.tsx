import type { FC } from 'react';
import { useMemo, Suspense } from 'react';
import type { TFunction } from 'i18next';
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
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { VolumeGroupSnapshotClassModel } from '@console/internal/models';
import type { VolumeGroupSnapshotClassKind, Selector } from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { DASH } from '@console/shared/src/constants/ui';
import { getAnnotations } from '@console/shared/src/selectors/common';

const kind = referenceForModel(VolumeGroupSnapshotClassModel);

const tableColumnInfo = [{ id: 'name' }, { id: 'driver' }, { id: 'deletionPolicy' }, { id: '' }];

const defaultSnapshotClassAnnotation = 'groupsnapshot.storage.kubernetes.io/is-default-class';

const isDefaultSnapshotClass = (volumeGroupSnapshotClass: VolumeGroupSnapshotClassKind) =>
  getAnnotations(volumeGroupSnapshotClass, { defaultSnapshotClassAnnotation: 'false' })[
    defaultSnapshotClassAnnotation
  ] === 'true';

const getDataViewRowsCreator: (t: TFunction) => GetDataViewRows<VolumeGroupSnapshotClassKind> =
  (t) => (data, columns) =>
    data.map(({ obj }) => {
      const name = obj.metadata?.name || '';
      const { deletionPolicy, driver } = obj;

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
        },
        [tableColumnInfo[1].id]: {
          cell: driver,
        },
        [tableColumnInfo[2].id]: {
          cell: deletionPolicy,
        },
      };

      return columns.map(({ id }) => {
        if (id === tableColumnInfo[3].id) return { id };
        const cell = rowCells[id]?.cell || DASH;
        return {
          id,
          cell,
        };
      });
    });

const useVolumeGroupSnapshotClassColumns = (): {
  columns: ConsoleDataViewColumn<VolumeGroupSnapshotClassKind>[];
} => {
  const { t } = useTranslation('console-app');

  const columns: ConsoleDataViewColumn<VolumeGroupSnapshotClassKind>[] = useMemo(
    () => [
      {
        type: 'name' as const,
        id: tableColumnInfo[0].id,
      },
      {
        title: t('Driver'),
        sort: 'driver',
        id: tableColumnInfo[1].id,
        props: { modifier: 'nowrap' as const },
      },
      {
        title: t('Deletion policy'),
        sort: 'deletionPolicy',
        id: tableColumnInfo[2].id,
        props: { modifier: 'nowrap' as const },
      },
      { type: 'actions' as const, id: tableColumnInfo[3].id },
    ],
    [t],
  );

  return { columns };
};

const VolumeGroupSnapshotClassTable: FC<VolumeGroupSnapshotClassTableProps> = ({
  data,
  loaded,
  ...props
}) => {
  const { t } = useTranslation('console-app');
  const { columns } = useVolumeGroupSnapshotClassColumns();
  const getDataViewRows = useMemo(() => getDataViewRowsCreator(t), [t]);

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<VolumeGroupSnapshotClassKind>
        {...props}
        id={VolumeGroupSnapshotClassModel}
        label={VolumeGroupSnapshotClassModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
      />
    </Suspense>
  );
};

export const VolumeGroupSnapshotClassPage: FC<VolumeGroupSnapshotClassPageProps> = ({
  canCreate = true,
  showTitle = true,
  namespace,
  selector,
}) => {
  const { t } = useTranslation('console-app');

  const [resources, loaded, loadError] = useK8sWatchResource<VolumeGroupSnapshotClassKind[]>({
    groupVersionKind: {
      group: VolumeGroupSnapshotClassModel.apiGroup,
      kind: VolumeGroupSnapshotClassModel.kind,
      version: VolumeGroupSnapshotClassModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
    selector,
  });

  return (
    <>
      <ListPageHeader
        title={showTitle ? t(VolumeGroupSnapshotClassModel.labelPluralKey || '') : ''}
      >
        {canCreate && (
          <ListPageCreate groupVersionKind={kind}>
            {t('Create VolumeGroupSnapshotClass')}
          </ListPageCreate>
        )}
      </ListPageHeader>
      <ListPageBody>
        <VolumeGroupSnapshotClassTable data={resources} loaded={loaded} loadError={loadError} />
      </ListPageBody>
    </>
  );
};

type VolumeGroupSnapshotClassPageProps = {
  namespace?: string;
  canCreate?: boolean;
  showTitle?: boolean;
  selector?: Selector;
};

type VolumeGroupSnapshotClassTableProps = {
  data: VolumeGroupSnapshotClassKind[];
  loaded: boolean;
  loadError: unknown;
};
