import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import {
  ListPageBody,
  ListPageCreateLink,
  ListPageFilter,
  ListPageHeader,
  RowProps,
  TableColumn,
  VirtualizedTable,
  useListPageFilter,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { TableData } from '@console/internal/components/factory';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import { Kebab, ResourceKebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  VolumeGroupSnapshotClassModel,
  VolumeGroupSnapshotContentModel,
  VolumeGroupSnapshotModel,
} from '@console/internal/models';
import {
  K8sResourceKind,
  PersistentVolumeClaimKind,
  Selector,
  VolumeGroupSnapshotKind,
  referenceForModel,
} from '@console/internal/module/k8s';
import { FLAGS, Status, getNamespace } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { snapshotStatusFilters, volumeSnapshotStatus } from '../../status';
import { PVCResourceViewer } from './pvc-resource-viewer';

const { common } = Kebab.factory;
const menuActions = [...common];

const tableColumnInfo = [
  { id: 'name' },
  { id: 'namespace' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'status' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-xl'), id: 'source' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'groupSnapshotContent' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'groupSnapshotClass' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-xl'), id: 'createdAt' },
  { className: Kebab.columnClass, id: '' },
];

const getTableColumns = (disableItems = {}): TableColumn<VolumeGroupSnapshotKind>[] =>
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
      title: i18next.t('console-app~Source'),
      sort: 'volumeGroupSnapshotSource',
      transforms: [sortable],
      props: { className: tableColumnInfo[3].className },
      id: tableColumnInfo[3].id,
    },
    {
      title: i18next.t('console-app~GroupSnapshot content'),
      sort: 'status.boundVolumeGroupSnapshotContentName',
      transforms: [sortable],
      props: { className: tableColumnInfo[4].className },
      id: tableColumnInfo[4].id,
    },
    {
      title: i18next.t('console-app~VolumeGroupSnapshotClass'),
      sort: 'spec.volumeGroupSnapshotClassName',
      transforms: [sortable],
      props: { className: tableColumnInfo[5].className },
      id: tableColumnInfo[5].id,
    },
    {
      title: i18next.t('console-app~Created at'),
      sort: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnInfo[6].className },
      id: tableColumnInfo[6].id,
    },
    {
      title: '',
      props: { className: tableColumnInfo[7].className },
      id: tableColumnInfo[7].id,
    },
  ].filter((item) => !disableItems[item.title]);

const Row: React.FC<RowProps<VolumeGroupSnapshotKind, VolumeGroupSnapshotRowProsCustomData>> = ({
  obj,
  rowData: { customData },
}) => {
  const { name, namespace, creationTimestamp } = obj?.metadata || {};
  const snapshotContent = obj?.status?.boundVolumeGroupSnapshotContentName;
  const snapshotClass = obj?.spec?.volumeGroupSnapshotClassName;
  const labelExpressions = obj?.spec?.source.selector.matchExpressions;

  const resourceWatch = React.useMemo(() => {
    const matchLabels = obj?.spec?.source?.selector?.matchLabels || {};
    const watch = {
      kind: referenceForModel(PersistentVolumeClaimModel),
      isList: true,
      namespace,
      selector: {
        matchLabels,
        matchExpressions: labelExpressions,
      },
    };

    return watch;
  }, [namespace, obj?.spec?.source?.selector?.matchLabels, labelExpressions]);

  const [data, loaded, loadError] = useK8sWatchResource<PersistentVolumeClaimKind[]>(resourceWatch);

  return (
    <>
      <TableData {...tableColumnInfo[0]}>
        <ResourceLink
          kind={referenceForModel(VolumeGroupSnapshotModel)}
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
      {!customData?.disableItems?.Source && (
        <TableData {...tableColumnInfo[3]}>
          {loaded && !loadError && (
            <PVCResourceViewer
              limit={5}
              pvcNames={data.map((pvc) => pvc.metadata.name)}
              namespace={namespace}
            />
          )}
        </TableData>
      )}
      {!customData?.disableItems?.['GroupSnapshot Content'] && (
        <TableData {...tableColumnInfo[4]}>
          {snapshotContent ? (
            <ResourceLink
              kind={referenceForModel(VolumeGroupSnapshotContentModel)}
              name={snapshotContent}
            />
          ) : (
            '-'
          )}
        </TableData>
      )}
      <TableData {...tableColumnInfo[5]}>
        {snapshotClass ? (
          <ResourceLink
            kind={referenceForModel(VolumeGroupSnapshotClassModel)}
            name={snapshotClass}
          />
        ) : (
          '-'
        )}
      </TableData>
      <TableData {...tableColumnInfo[6]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData {...tableColumnInfo[7]}>
        <ResourceKebab
          kind={referenceForModel(VolumeGroupSnapshotModel)}
          resource={obj}
          actions={menuActions}
        />
      </TableData>
    </>
  );
};

const VolumeGroupSnapshotTable: React.FC<VolumeGroupSnapshotTableProps> = (props) => {
  const { t } = useTranslation();
  const [columns] = useActiveColumns({
    columns: getTableColumns(props.rowData.customData.disableItems),
  });

  return (
    <VirtualizedTable<VolumeGroupSnapshotKind>
      {...props}
      data={props.data}
      aria-label={t('console-app~VolumeGroupSnapshots')}
      label={t('console-app~VolumeGroupSnapshots')}
      columns={columns}
      Row={Row}
    />
  );
};

const VolumeGroupSnapshotPage: React.FC<VolumeGroupSnapshotPageProps> = ({
  canCreate = true,
  showTitle = true,
  namespace,
  selector,
}) => {
  const { t } = useTranslation();
  const canListVGSC = useFlag(FLAGS.CAN_LIST_VGSC);

  const createPath = `/k8s/ns/${namespace || 'default'}/${
    VolumeGroupSnapshotModel.plural
  }/~new/form`;
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
  const [data, filteredData, onFilterChange] = useListPageFilter(resources);

  return (
    <>
      <ListPageHeader title={showTitle ? t(VolumeGroupSnapshotModel.labelPluralKey) : undefined}>
        {canCreate && (
          <ListPageCreateLink to={createPath}>
            {t('console-app~Create VolumeGroupSnapshot')}
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
        <VolumeGroupSnapshotTable
          data={filteredData}
          unfilteredData={resources}
          rowData={{
            customData: {
              disableItems: { 'Group Snapshot Content': !canListVGSC },
            },
          }}
          loaded={loaded}
          loadError={loadError}
        />
      </ListPageBody>
    </>
  );
};

const checkPVCSnapshot: CheckPVCSnapshot = (VolumeGroupSnapshots, pvc) =>
  VolumeGroupSnapshots?.filter((snapshot) => getNamespace(snapshot) === getNamespace(pvc));

const FilteredSnapshotTable: React.FC<FilteredSnapshotTable> = (props) => {
  const { t } = useTranslation();
  const { data, rowData } = props;

  const [columns] = useActiveColumns({
    columns: getTableColumns(rowData.customData?.disableItems),
  });
  return (
    <VirtualizedTable<VolumeGroupSnapshotKind>
      {...props}
      data={checkPVCSnapshot(data, rowData.customData.pvc)}
      aria-label={t('console-app~VolumeGroupSnapshots')}
      label={t('console-app~VolumeGroupSnapshots')}
      columns={columns}
      Row={Row}
    />
  );
};

export const VolumeGroupSnapshotPVCPage: React.FC<VolumeGroupSnapshotPVCPage> = ({ ns, obj }) => {
  const { t } = useTranslation();
  const params = useParams();
  const canListVSC = useFlag(FLAGS.CAN_LIST_VGSC);
  const namespace = ns || params?.ns;
  const [resources, loaded, loadError] = useK8sWatchResource<VolumeGroupSnapshotKind[]>({
    groupVersionKind: {
      group: VolumeGroupSnapshotModel.apiGroup,
      kind: VolumeGroupSnapshotModel.kind,
      version: VolumeGroupSnapshotModel.apiVersion,
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
type VolumeGroupSnapshotPageProps = {
  namespace?: string;
  canCreate?: boolean;
  showTitle?: boolean;
  selector?: Selector;
};

type CheckPVCSnapshot = (
  VolumeGroupSnapshots: VolumeGroupSnapshotKind[],
  pvc: K8sResourceKind,
) => VolumeGroupSnapshotKind[];

type FilteredSnapshotTable = {
  data: VolumeGroupSnapshotKind[];
  unfilteredData: VolumeGroupSnapshotKind[];
  rowData: { [key: string]: any };
  loaded: boolean;
  loadError: any;
};

type VolumeGroupSnapshotPVCPage = {
  obj: PersistentVolumeClaimKind;
  ns: string;
};

type VolumeGroupSnapshotTableProps = {
  data: VolumeGroupSnapshotKind[];
  unfilteredData: VolumeGroupSnapshotKind[];
  rowData?: { [key: string]: any };
  loaded: boolean;
  loadError: any;
};

type VolumeGroupSnapshotRowProsCustomData = {
  customData?: { [key: string]: any };
};

export default VolumeGroupSnapshotPage;
