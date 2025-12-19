import { useMemo, useCallback, Suspense } from 'react';
import { DataViewCheckboxFilter } from '@patternfly/react-data-view';
import { DataViewFilterOption } from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import {
  actionsCellProps,
  cellIsStickyProps,
  getNameCellProps,
  initialFiltersDefault,
  ConsoleDataView,
} from '@console/app/src/components/data-view/ConsoleDataView';
import { ResourceFilters, GetDataViewRows } from '@console/app/src/components/data-view/types';
import {
  ListPageBody,
  ListPageHeader,
  ListPageCreateLink,
  TableColumn,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { convertToBaseValue, humanizeBinaryBytes } from '@console/internal/components/utils/units';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  VolumeSnapshotContentModel,
} from '@console/internal/models';
import {
  K8sResourceKind,
  PersistentVolumeClaimKind,
  referenceForModel,
  VolumeSnapshotKind,
  Selector,
  referenceFor,
} from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { Timestamp } from '@console/shared/src/components/datetime/Timestamp';
import { LoadingBox } from '@console/shared/src/components/loading/LoadingBox';
import { Status } from '@console/shared/src/components/status/Status';
import { FLAGS } from '@console/shared/src/constants/common';
import { DASH } from '@console/shared/src/constants/ui';
import { useFlag } from '@console/shared/src/hooks/flag';
import { getName, getNamespace } from '@console/shared/src/selectors/common';
import { snapshotSource } from '@console/shared/src/sorts/snapshot';
import { volumeSnapshotStatus } from '../../status';

const kind = referenceForModel(VolumeSnapshotModel);

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { id: 'status' },
  { id: 'size' },
  { id: 'source' },
  { id: 'snapshotContent' },
  { id: 'snapshotClass' },
  { id: 'createdAt' },
  { id: '' },
];

const getDataViewRows: GetDataViewRows<VolumeSnapshotKind, VolumeSnapshotRowData> = (
  data,
  columns,
) => {
  return data.map(({ obj, rowData: { hideSnapshotContentColumn } }) => {
    const name = obj.metadata?.name || '';
    const namespace = obj.metadata?.namespace || '';
    const creationTimestamp = obj.metadata?.creationTimestamp || '';
    const size = obj.status?.restoreSize;
    const sizeBase = convertToBaseValue(size);
    const sizeMetrics = size ? humanizeBinaryBytes(sizeBase).string : DASH;
    const sourceModel = obj.spec?.source?.persistentVolumeClaimName
      ? PersistentVolumeClaimModel
      : VolumeSnapshotContentModel;
    const sourceName = snapshotSource(obj);
    const snapshotContent = obj.status?.boundVolumeSnapshotContentName;
    const snapshotClass = obj.spec?.volumeSnapshotClassName;
    const context = { [referenceFor(obj)]: obj };

    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: <ResourceLink kind={kind} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [tableColumnInfo[1].id]: {
        cell: <ResourceLink kind={NamespaceModel.kind} name={namespace} />,
      },
      [tableColumnInfo[2].id]: {
        cell: <Status status={volumeSnapshotStatus(obj)} />,
      },
      [tableColumnInfo[3].id]: {
        cell: sizeMetrics,
      },
      [tableColumnInfo[4].id]: {
        cell: (
          <ResourceLink
            kind={referenceForModel(sourceModel)}
            name={sourceName}
            namespace={namespace}
          />
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: snapshotContent ? (
          <ResourceLink
            kind={referenceForModel(VolumeSnapshotContentModel)}
            name={snapshotContent}
          />
        ) : (
          DASH
        ),
        disabled: hideSnapshotContentColumn,
      },
      [tableColumnInfo[6].id]: {
        cell: snapshotClass ? (
          <ResourceLink kind={referenceForModel(VolumeSnapshotClassModel)} name={snapshotClass} />
        ) : (
          DASH
        ),
      },
      [tableColumnInfo[7].id]: {
        cell: <Timestamp timestamp={creationTimestamp} />,
      },
      [tableColumnInfo[8].id]: {
        cell: <LazyActionMenu context={context} />,
        props: actionsCellProps,
      },
    };

    return columns
      .filter(({ id }) => !rowCells[id].disabled)
      .map(({ id }) => {
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

const useVolumeSnapshotColumns = (
  rowData: VolumeSnapshotRowData,
): TableColumn<VolumeSnapshotKind>[] => {
  const { t } = useTranslation();

  const columns: TableColumn<VolumeSnapshotKind>[] = useMemo(
    () =>
      [
        {
          title: t('console-app~Name'),
          sort: 'metadata.name',
          id: tableColumnInfo[0].id,
          props: { ...cellIsStickyProps, modifier: 'nowrap' },
        },
        {
          title: t('console-app~Namespace'),
          sort: 'metadata.namespace',
          id: tableColumnInfo[1].id,
          props: { modifier: 'nowrap' },
        },
        {
          title: t('console-app~Status'),
          sort: 'snapshotStatus',
          id: tableColumnInfo[2].id,
          props: { modifier: 'nowrap' },
        },
        {
          title: t('console-app~Size'),
          sort: 'volumeSnapshotSize',
          id: tableColumnInfo[3].id,
          props: { modifier: 'nowrap' },
        },
        {
          title: t('console-app~Source'),
          sort: 'volumeSnapshotSource',
          id: tableColumnInfo[4].id,
          props: { modifier: 'nowrap' },
        },
        {
          title: t('console-app~Snapshot content'),
          sort: 'status.boundVolumeSnapshotContentName',
          id: tableColumnInfo[5].id,
          props: { modifier: 'nowrap' },
          disabled: rowData.hideSnapshotContentColumn,
        },
        {
          title: t('console-app~VolumeSnapshotClass'),
          sort: 'spec.volumeSnapshotClassName',
          id: tableColumnInfo[6].id,
          props: { modifier: 'nowrap' },
        },
        {
          title: t('console-app~Created at'),
          sort: 'metadata.creationTimestamp',
          id: tableColumnInfo[7].id,
          props: { modifier: 'nowrap' },
        },
        {
          title: '',
          id: tableColumnInfo[8].id,
          props: { ...cellIsStickyProps },
        },
      ].filter((c) => !c.disabled),
    [t, rowData.hideSnapshotContentColumn],
  );

  return columns;
};

const VolumeSnapshotTable: Snail.FCC<VolumeSnapshotTableProps> = ({ data, loaded, ...props }) => {
  const { t } = useTranslation();
  const canListVSC = useFlag(FLAGS.CAN_LIST_VSC);

  const customRowData: VolumeSnapshotRowData = {
    hideSnapshotContentColumn: !canListVSC,
  };

  const columns = useVolumeSnapshotColumns(customRowData);

  const volumeSnapshotStatusFilterOptions = useMemo<DataViewFilterOption[]>(
    () => [
      {
        value: 'Ready',
        label: t('console-app~Ready'),
      },
      {
        value: 'Pending',
        label: t('console-app~Pending'),
      },
      {
        value: 'Error',
        label: t('console-app~Error'),
      },
    ],
    [t],
  );

  const initialFilters = useMemo<VolumeSnapshotFilters>(
    () => ({ ...initialFiltersDefault, status: [] }),
    [],
  );

  const additionalFilterNodes = useMemo<React.ReactNode[]>(
    () => [
      <DataViewCheckboxFilter
        key="status"
        filterId="status"
        title={t('console-app~Status')}
        placeholder={t('console-app~Filter by status')}
        options={volumeSnapshotStatusFilterOptions}
      />,
    ],
    [t, volumeSnapshotStatusFilterOptions],
  );

  const matchesAdditionalFilters = useCallback(
    (resource: VolumeSnapshotKind, filters: VolumeSnapshotFilters) => {
      // Status filter
      if (filters.status.length > 0) {
        const status = volumeSnapshotStatus(resource);
        if (!filters.status.includes(status)) {
          return false;
        }
      }

      return true;
    },
    [],
  );

  return (
    (<Suspense fallback={<LoadingBox />}>
      <ConsoleDataView<VolumeSnapshotKind>
        {...props}
        label={VolumeSnapshotModel.labelPlural}
        data={data}
        loaded={loaded}
        columns={columns}
        getDataViewRows={getDataViewRows}
        customRowData={customRowData}
        initialFilters={initialFilters}
        additionalFilterNodes={additionalFilterNodes}
        matchesAdditionalFilters={matchesAdditionalFilters}
        hideColumnManagement
      />
    </Suspense>)
  );
};

export const VolumeSnapshotPage: Snail.FCC<VolumeSnapshotPageProps> = ({
  canCreate = true,
  showTitle = true,
  namespace,
  selector,
}) => {
  const { t } = useTranslation();

  const createPath = `/k8s/ns/${namespace || 'default'}/${VolumeSnapshotModel.plural}/~new/form`;

  const [resources, loaded, loadError] = useK8sWatchResource<VolumeSnapshotKind[]>({
    groupVersionKind: {
      group: VolumeSnapshotModel.apiGroup,
      kind: VolumeSnapshotModel.kind,
      version: VolumeSnapshotModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
    selector,
  });

  return (
    <>
      <ListPageHeader title={showTitle ? t(VolumeSnapshotModel.labelPluralKey || '') : ''}>
        {canCreate && (
          <ListPageCreateLink to={createPath}>
            {t('console-app~Create VolumeSnapshot')}
          </ListPageCreateLink>
        )}
      </ListPageHeader>
      <ListPageBody>
        <VolumeSnapshotTable data={resources} loaded={loaded} loadError={loadError} />
      </ListPageBody>
    </>
  );
};

const checkPVCSnapshot = (
  volumeSnapshots: VolumeSnapshotKind[],
  pvc: K8sResourceKind,
): VolumeSnapshotKind[] =>
  volumeSnapshots?.filter(
    (snapshot) =>
      snapshot?.spec?.source?.persistentVolumeClaimName === getName(pvc) &&
      getNamespace(snapshot) === getNamespace(pvc),
  );

export const VolumeSnapshotPVCPage: Snail.FCC<VolumeSnapshotPVCPage> = ({ ns, obj }) => {
  const params = useParams();
  const namespace = ns || params?.ns;

  const [resources, loaded, loadError] = useK8sWatchResource<VolumeSnapshotKind[]>({
    groupVersionKind: {
      group: VolumeSnapshotModel.apiGroup,
      kind: VolumeSnapshotModel.kind,
      version: VolumeSnapshotModel.apiVersion,
    },
    isList: true,
    namespaced: true,
    namespace,
  });

  return (
    <ListPageBody>
      <VolumeSnapshotTable
        data={checkPVCSnapshot(resources, obj)}
        loaded={loaded}
        loadError={loadError}
      />
    </ListPageBody>
  );
};

type VolumeSnapshotFilters = ResourceFilters & {
  status: string[];
};

type VolumeSnapshotPageProps = {
  namespace?: string;
  canCreate?: boolean;
  showTitle?: boolean;
  selector?: Selector;
};

type VolumeSnapshotPVCPage = {
  obj: PersistentVolumeClaimKind;
  ns: string;
};

type VolumeSnapshotTableProps = {
  data: VolumeSnapshotKind[];
  loaded: boolean;
  loadError: unknown;
};

type VolumeSnapshotRowData = {
  hideSnapshotContentColumn?: boolean;
};
