import type { FC } from 'react';
import { useMemo, useCallback, Suspense } from 'react';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import type { DataViewFilterOption } from '@patternfly/react-data-view/dist/esm/DataViewFilters';
import { useTranslation } from 'react-i18next';
import { ConsoleDataView } from '@console/app/src/components/data-view/ConsoleDataView';
import type {
  ConsoleDataViewColumn,
  ResourceFilters,
  GetDataViewRows,
} from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  ListPageBody,
  ListPageHeader,
  ListPageCreateLink,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { sortResourceByValue } from '@console/internal/components/factory/Table/sort';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import {
  NamespaceModel,
  VolumeGroupSnapshotModel,
  VolumeGroupSnapshotClassModel,
  VolumeGroupSnapshotContentModel,
  VolumeSnapshotModel,
} from '@console/internal/models';
import type {
  VolumeGroupSnapshotKind,
  VolumeSnapshotKind,
  Selector,
} from '@console/internal/module/k8s';
import { referenceForModel } from '@console/internal/module/k8s';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { Status } from '@console/shared/src/components/status/Status';
import { FLAGS } from '@console/shared/src/constants/common';
import { DASH } from '@console/shared/src/constants/ui';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { groupSnapshotStatus } from '@console/shared/src/sorts/snapshot';
import { PVCResourceViewer } from './pvc-resource-viewer';

const kind = referenceForModel(VolumeGroupSnapshotModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'status' },
  { id: 'source' },
  { id: 'snapshotContent' },
  { id: 'snapshotClass' },
  { id: 'createdAt' },
  { id: '' },
];

const GroupSnapshotSource: FC<{ name: string; namespace: string }> = ({ name, namespace }) => {
  const [volumeSnapshots, loaded, loadError] = useK8sWatchResource<VolumeSnapshotKind[]>({
    groupVersionKind: {
      group: VolumeSnapshotModel.apiGroup,
      kind: VolumeSnapshotModel.kind,
      version: VolumeSnapshotModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
  });

  // Derive group membership from the actual bound VolumeSnapshots (via ownerReferences)
  // instead of re-evaluating spec.source.selector client-side, so this reflects what the
  // backend actually snapshotted rather than what the selector was intended to match.
  const pvcNames = useMemo(
    () =>
      loaded && !loadError
        ? volumeSnapshots
            .filter((vs) =>
              vs?.metadata?.ownerReferences?.some(
                (ref) => ref.kind === 'VolumeGroupSnapshot' && ref.name === name,
              ),
            )
            .map((vs) => vs?.spec?.source?.persistentVolumeClaimName)
            .filter(Boolean)
        : [],
    [volumeSnapshots, loaded, loadError, name],
  );

  if (!loaded || loadError) {
    return <>{DASH}</>;
  }

  return <PVCResourceViewer limit={5} pvcNames={pvcNames} namespace={namespace} />;
};

const getDataViewRows: GetDataViewRows<VolumeGroupSnapshotKind, VolumeGroupSnapshotRowData> = (
  data,
  columns,
) =>
  data.map(({ obj, rowData: { hideSnapshotContentColumn } }) => {
    const name = obj.metadata?.name || '';
    const namespace = obj.metadata?.namespace || '';
    const creationTimestamp = obj.metadata?.creationTimestamp || '';
    const snapshotContent = obj.status?.boundVolumeGroupSnapshotContentName;
    const snapshotClass = obj.spec?.volumeGroupSnapshotClassName;

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kind} name={name} namespace={namespace} />,
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind={NamespaceModel.kind} name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <Status status={groupSnapshotStatus(obj)} />,
      },
      [tableColumnInfo[3].id]: {
        cell: <GroupSnapshotSource name={name} namespace={namespace} />,
      },
      [tableColumnInfo[4].id]: {
        cell: snapshotContent ? (
          <ResourceLink
            kind={referenceForModel(VolumeGroupSnapshotContentModel)}
            name={snapshotContent}
          />
        ) : (
          DASH
        ),
        disabled: hideSnapshotContentColumn,
      },
      [tableColumnInfo[5].id]: {
        cell: snapshotClass ? (
          <ResourceLink
            kind={referenceForModel(VolumeGroupSnapshotClassModel)}
            name={snapshotClass}
          />
        ) : (
          DASH
        ),
      },
      [tableColumnInfo[6].id]: {
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
    };

    return columns
      .filter(({ id }) => !rowCells[id]?.disabled)
      .map(({ id }) => {
        if (id === tableColumnInfo[7].id) return { id };
        const cell = rowCells[id]?.cell || DASH;
        return {
          id,
          cell,
        };
      });
  });

const useVolumeGroupSnapshotColumns = (
  rowData: VolumeGroupSnapshotRowData,
): { columns: ConsoleDataViewColumn<VolumeGroupSnapshotKind>[] } => {
  const { t } = useTranslation('console-app');

  const columns: ConsoleDataViewColumn<VolumeGroupSnapshotKind>[] = useMemo(
    () =>
      [
        {
          type: 'name' as const,
          id: tableColumnInfo[0].id,
        },
        {
          type: 'namespace' as const,
          id: tableColumnInfo[1].id,
        },
        {
          title: t('Status'),
          sort: (data, direction) => data.sort(sortResourceByValue(direction, groupSnapshotStatus)),
          id: tableColumnInfo[2].id,
          props: { modifier: 'nowrap' as const },
        },
        {
          title: t('Source'),
          id: tableColumnInfo[3].id,
          props: { modifier: 'nowrap' as const },
        },
        {
          title: t('GroupSnapshot content'),
          sort: 'status.boundVolumeGroupSnapshotContentName',
          id: tableColumnInfo[4].id,
          props: { modifier: 'nowrap' as const },
          disabled: rowData.hideSnapshotContentColumn,
        },
        {
          title: t('VolumeGroupSnapshotClass'),
          sort: 'spec.volumeGroupSnapshotClassName',
          id: tableColumnInfo[5].id,
          props: { modifier: 'nowrap' as const },
        },
        {
          title: t('Created at'),
          sort: 'metadata.creationTimestamp',
          id: tableColumnInfo[6].id,
          props: { modifier: 'nowrap' as const },
        },
        { type: 'actions' as const, id: tableColumnInfo[7].id },
      ].filter((c) => !c.disabled),
    [t, rowData.hideSnapshotContentColumn],
  );

  return { columns };
};

const VolumeGroupSnapshotTable: FC<VolumeGroupSnapshotTableProps> = ({
  data,
  loaded,
  ...props
}) => {
  const { t } = useTranslation('console-app');
  const canListVGSC = useFlag(FLAGS.CAN_LIST_VGSC);

  const customRowData: VolumeGroupSnapshotRowData = {
    hideSnapshotContentColumn: !canListVGSC,
  };

  const { columns } = useVolumeGroupSnapshotColumns(customRowData);

  const snapshotStatusFilterOptions = useMemo<DataViewFilterOption[]>(
    () => [
      {
        value: 'Ready',
        label: t('Ready'),
      },
      {
        value: 'Pending',
        label: t('Pending'),
      },
      {
        value: 'Error',
        label: t('Error'),
      },
    ],
    [t],
  );

  const initialFilters = useMemo<VolumeGroupSnapshotFilters>(() => ({ status: [] }), []);

  const additionalFilterNodes = useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('Status')}
        placeholder={t('Filter by status')}
        options={snapshotStatusFilterOptions}
      />,
    ],
    [t, snapshotStatusFilterOptions],
  );

  const matchesAdditionalFilters = useCallback(
    (resource: VolumeGroupSnapshotKind, filters: VolumeGroupSnapshotFilters) => {
      if (filters.status.length > 0) {
        const status = groupSnapshotStatus(resource);
        if (!filters.status.includes(status)) {
          return false;
        }
      }

      return true;
    },
    [],
  );

  return (
    <Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<VolumeGroupSnapshotKind>
        {...props}
        id={VolumeGroupSnapshotModel}
        label={VolumeGroupSnapshotModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        customRowData={customRowData}
        initialFilters={initialFilters}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
      />
    </Suspense>
  );
};

export const VolumeGroupSnapshotPage: FC<VolumeGroupSnapshotPageProps> = ({
  canCreate = true,
  showTitle = true,
  namespace,
  selector,
}) => {
  const { t } = useTranslation('console-app');

  const createPath = `/k8s/ns/${namespace || 'default'}/${VolumeGroupSnapshotModel.plural}/~new/form`;

  const [resources, loaded, loadError] = useK8sWatchResource<VolumeGroupSnapshotKind[]>({
    groupVersionKind: {
      group: VolumeGroupSnapshotModel.apiGroup,
      kind: VolumeGroupSnapshotModel.kind,
      version: VolumeGroupSnapshotModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
    selector,
  });

  return (
    <>
      <ListPageHeader title={showTitle ? t(VolumeGroupSnapshotModel.labelPluralKey || '') : ''}>
        {canCreate && (
          <ListPageCreateLink to={createPath}>{t('Create VolumeGroupSnapshot')}</ListPageCreateLink>
        )}
      </ListPageHeader>
      <ListPageBody>
        <VolumeGroupSnapshotTable data={resources} loaded={loaded} loadError={loadError} />
      </ListPageBody>
    </>
  );
};

type VolumeGroupSnapshotFilters = ResourceFilters & {
  status: string[];
};

type VolumeGroupSnapshotPageProps = {
  namespace?: string;
  canCreate?: boolean;
  showTitle?: boolean;
  selector?: Selector;
};

type VolumeGroupSnapshotTableProps = {
  data: VolumeGroupSnapshotKind[];
  loaded: boolean;
  loadError: unknown;
};

type VolumeGroupSnapshotRowData = {
  hideSnapshotContentColumn?: boolean;
};
