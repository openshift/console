import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import {
  ListPageBody,
  useListPageFilter,
  ListPageFilter,
  ListPageHeader,
  ListPageCreateLink,
  VirtualizedTable,
  TableColumn,
  RowProps,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { TableData } from '@console/internal/components/factory';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import {
  ResourceLink,
  ResourceKebab,
  Timestamp,
  Kebab,
  convertToBaseValue,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
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
} from '@console/internal/module/k8s';
import { Status, getName, getNamespace, snapshotSource, FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { snapshotStatusFilters, volumeSnapshotStatus } from '../../status';

const { common, RestorePVC } = Kebab.factory;
const menuActions = [RestorePVC, ...common];

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'status' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'size' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-xl'), id: 'source' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'snapshotContent' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'snapshotClass' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-xl'), id: 'createdAt' },
  { className: Kebab.columnClass, id: '' },
];

const getTableColumns = (disableItems = {}): TableColumn<VolumeSnapshotKind>[] =>
  [
    {
      title: i18next.t('console-app~Name'),
      sort: 'metadata.name',
      transforms: [sortable],
      id: tableColumnInfo[0].id,
    },
    {
      title: i18next.t('console-app~Namespace'),
      sort: 'metadata.namespace',
      transforms: [sortable],
      id: tableColumnInfo[1].id,
    },
    {
      title: i18next.t('console-app~Status'),
      sort: 'snapshotStatus',
      transforms: [sortable],
      props: { className: tableColumnInfo[2].className },
      id: tableColumnInfo[2].id,
    },
    {
      title: i18next.t('console-app~Size'),
      sort: 'volumeSnapshotSize',
      transforms: [sortable],
      props: { className: tableColumnInfo[3].className },
      id: tableColumnInfo[3].id,
    },
    {
      title: i18next.t('console-app~Source'),
      sort: 'volumeSnapshotSource',
      transforms: [sortable],
      props: { className: tableColumnInfo[4].className },
      id: tableColumnInfo[4].id,
    },
    {
      title: i18next.t('console-app~Snapshot content'),
      sort: 'status.boundVolumeSnapshotContentName',
      transforms: [sortable],
      props: { className: tableColumnInfo[5].className },
      id: tableColumnInfo[5].id,
    },
    {
      title: i18next.t('console-app~VolumeSnapshotClass'),
      sort: 'spec.volumeSnapshotClassName',
      transforms: [sortable],
      props: { className: tableColumnInfo[6].className },
      id: tableColumnInfo[6].id,
    },
    {
      title: i18next.t('console-app~Created at'),
      sort: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnInfo[7].className },
      id: tableColumnInfo[7].id,
    },
    {
      title: '',
      props: { className: tableColumnInfo[8].className },
      id: tableColumnInfo[8].id,
    },
  ].filter((item) => !disableItems[item.title]);

const Row: React.FC<RowProps<VolumeSnapshotKind, VolumeSnapshotRowProsCustomData>> = ({
  obj,
  rowData: { customData },
}) => {
  const { name, namespace, creationTimestamp } = obj?.metadata || {};
  const size = obj?.status?.restoreSize;
  const sizeBase = convertToBaseValue(size);
  const sizeMetrics = size ? humanizeBinaryBytes(sizeBase).string : '-';
  const sourceModel = obj?.spec?.source?.persistentVolumeClaimName
    ? PersistentVolumeClaimModel
    : VolumeSnapshotContentModel;
  const sourceName = snapshotSource(obj);
  const snapshotContent = obj?.status?.boundVolumeSnapshotContentName;
  const snapshotClass = obj?.spec?.volumeSnapshotClassName;

  return (
    <>
      <TableData {...tableColumnInfo[0]}>
        <ResourceLink
          kind={referenceForModel(VolumeSnapshotModel)}
          name={name}
          namespace={namespace}
        />
      </TableData>
      <TableData {...tableColumnInfo[1]} columnID="namespace">
        <ResourceLink kind={NamespaceModel.kind} name={namespace} />
      </TableData>
      <TableData {...tableColumnInfo[2]}>
        <Status status={volumeSnapshotStatus(obj)} />
      </TableData>
      <TableData {...tableColumnInfo[3]}>{sizeMetrics}</TableData>
      {!customData?.disableItems?.Source && (
        <TableData {...tableColumnInfo[4]}>
          <ResourceLink
            kind={referenceForModel(sourceModel)}
            name={sourceName}
            namespace={namespace}
          />
        </TableData>
      )}
      {!customData?.disableItems?.['Snapshot Content'] && (
        <TableData {...tableColumnInfo[5]}>
          {snapshotContent ? (
            <ResourceLink
              kind={referenceForModel(VolumeSnapshotContentModel)}
              name={snapshotContent}
            />
          ) : (
            '-'
          )}
        </TableData>
      )}
      <TableData {...tableColumnInfo[6]}>
        {snapshotClass ? (
          <ResourceLink kind={referenceForModel(VolumeSnapshotClassModel)} name={snapshotClass} />
        ) : (
          '-'
        )}
      </TableData>
      <TableData {...tableColumnInfo[7]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData {...tableColumnInfo[8]}>
        <ResourceKebab
          kind={referenceForModel(VolumeSnapshotModel)}
          resource={obj}
          actions={menuActions}
        />
      </TableData>
    </>
  );
};

const VolumeSnapshotTable: React.FC<VolumeSnapshotTableProps> = (props) => {
  const { t } = useTranslation();
  const [columns] = useActiveColumns({
    columns: getTableColumns(props.rowData.customData.disableItems),
  });

  return (
    <VirtualizedTable<VolumeSnapshotKind>
      {...props}
      data={props.data}
      aria-label={t('console-app~VolumeSnapshots')}
      label={t('console-app~VolumeSnapshots')}
      columns={columns}
      Row={Row}
    />
  );
};

const VolumeSnapshotPage: React.FC<VolumeSnapshotPageProps> = ({
  canCreate = true,
  showTitle = true,
  namespace,
}) => {
  const { t } = useTranslation();
  const canListVSC = useFlag(FLAGS.CAN_LIST_VSC);
  const createPath = `/k8s/${namespace === 'all-namespaces' ? namespace : `ns/${namespace}`}/${
    VolumeSnapshotModel.plural
  }/~new/form`;
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
  const [data, filteredData, onFilterChange] = useListPageFilter(resources);

  return (
    <>
      <ListPageHeader title={showTitle ? t(VolumeSnapshotModel.labelPluralKey) : undefined}>
        {canCreate && (
          <ListPageCreateLink to={createPath}>
            {t('console-app~Create VolumeSnapshot')}
          </ListPageCreateLink>
        )}
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter
          data={data}
          loaded={loaded}
          onFilterChange={onFilterChange}
          rowFilters={snapshotStatusFilters(t)}
        />
        <VolumeSnapshotTable
          data={filteredData}
          unfilteredData={resources}
          rowData={{
            customData: {
              disableItems: { 'Snapshot Content': !canListVSC },
            },
          }}
          loaded={loaded}
          loadError={loadError}
        />
      </ListPageBody>
    </>
  );
};

const checkPVCSnapshot: CheckPVCSnapshot = (volumeSnapshots, pvc) =>
  volumeSnapshots?.filter(
    (snapshot) =>
      snapshot?.spec?.source?.persistentVolumeClaimName === getName(pvc) &&
      getNamespace(snapshot) === getNamespace(pvc),
  );

const FilteredSnapshotTable: React.FC<FilteredSnapshotTable> = (props) => {
  const { t } = useTranslation();
  const { data, rowData } = props;

  const [columns] = useActiveColumns({
    columns: getTableColumns(rowData.customData?.disableItems),
  });
  return (
    <VirtualizedTable<VolumeSnapshotKind>
      {...props}
      data={checkPVCSnapshot(data, rowData.customData.pvc)}
      aria-label={t('console-app~VolumeSnapshots')}
      label={t('console-app~VolumeSnapshots')}
      columns={columns}
      Row={Row}
    />
  );
};

export const VolumeSnapshotPVCPage: React.FC<VolumeSnapshotPVCPage> = ({ ns, obj }) => {
  const { t } = useTranslation();
  const params = useParams();
  const canListVSC = useFlag(FLAGS.CAN_LIST_VSC);
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
  const [data, filteredData, onFilterChange] = useListPageFilter(resources);

  return (
    <ListPageBody>
      <ListPageFilter
        data={checkPVCSnapshot(data, obj)}
        loaded={loaded}
        onFilterChange={onFilterChange}
        rowFilters={snapshotStatusFilters(t)}
      />
      <FilteredSnapshotTable
        data={filteredData}
        unfilteredData={resources}
        rowData={{
          customData: {
            pvc: obj,
            disableItems: { Source: true, 'Snapshot Content': !canListVSC },
          },
        }}
        loaded={loaded}
        loadError={loadError}
      />
    </ListPageBody>
  );
};
type VolumeSnapshotPageProps = {
  namespace?: string;
  canCreate?: boolean;
  showTitle?: boolean;
};

type CheckPVCSnapshot = (
  volumeSnapshots: VolumeSnapshotKind[],
  pvc: K8sResourceKind,
) => VolumeSnapshotKind[];

type FilteredSnapshotTable = {
  data: VolumeSnapshotKind[];
  unfilteredData: VolumeSnapshotKind[];
  rowData: { [key: string]: any };
  loaded: boolean;
  loadError: any;
};

type VolumeSnapshotPVCPage = {
  obj: PersistentVolumeClaimKind;
  ns: string;
};

type VolumeSnapshotTableProps = {
  data: VolumeSnapshotKind[];
  unfilteredData: VolumeSnapshotKind[];
  rowData?: { [key: string]: any };
  loaded: boolean;
  loadError: any;
};

type VolumeSnapshotRowProsCustomData = {
  customData?: { [key: string]: any };
};

export default VolumeSnapshotPage;
