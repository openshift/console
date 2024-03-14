import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  ListPageBody,
  useListPageFilter,
  ListPageCreate,
  ListPageFilter,
  ListPageHeader,
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
  humanizeBinaryBytes,
  PageComponentProps,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  VolumeSnapshotModel,
  VolumeSnapshotClassModel,
  VolumeSnapshotContentModel,
} from '@console/internal/models';
import { referenceForModel, VolumeSnapshotContentKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { snapshotStatusFilters, volumeSnapshotStatus } from '../../status';

export const tableColumnInfo = [
  { id: 'name' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'status' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'size' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'volumeSnapshot' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'snapshotClass' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'createdAt' },
  { className: Kebab.columnClass, id: '' },
];

const Row: React.FC<RowProps<VolumeSnapshotContentKind>> = ({ obj }) => {
  const { name, creationTimestamp } = obj?.metadata || {};
  const { name: snapshotName, namespace: snapshotNamespace } = obj?.spec?.volumeSnapshotRef || {};
  const size = obj.status?.restoreSize;
  const sizeMetrics = size ? humanizeBinaryBytes(size).string : '-';

  return (
    <>
      <TableData {...tableColumnInfo[0]}>
        <ResourceLink kind={referenceForModel(VolumeSnapshotContentModel)} name={name} />
      </TableData>
      <TableData {...tableColumnInfo[1]}>
        <Status status={volumeSnapshotStatus(obj)} />
      </TableData>
      <TableData {...tableColumnInfo[2]}>{sizeMetrics}</TableData>
      <TableData {...tableColumnInfo[3]}>
        <ResourceLink
          kind={referenceForModel(VolumeSnapshotModel)}
          name={snapshotName}
          namespace={snapshotNamespace}
        />
      </TableData>
      <TableData {...tableColumnInfo[4]}>
        <ResourceLink
          kind={referenceForModel(VolumeSnapshotClassModel)}
          name={obj?.spec?.volumeSnapshotClassName}
        />
      </TableData>
      <TableData {...tableColumnInfo[5]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData {...tableColumnInfo[6]}>
        <ResourceKebab
          kind={referenceForModel(VolumeSnapshotContentModel)}
          resource={obj}
          actions={Kebab.factory.common}
        />
      </TableData>
    </>
  );
};

const VolumeSnapshotContentTable: React.FC<VolumeSnapshotContentTableProps> = (props) => {
  const { t } = useTranslation();
  const getTableColumns = (): TableColumn<VolumeSnapshotContentKind>[] => [
    {
      title: t('console-app~Name'),
      sort: 'metadata.name',
      transforms: [sortable],
      id: tableColumnInfo[0].id,
    },
    {
      title: t('console-app~Status'),
      sort: 'snapshotStatus',
      transforms: [sortable],
      props: { className: tableColumnInfo[1].className },
      id: tableColumnInfo[1].id,
    },
    {
      title: t('console-app~Size'),
      sort: 'volumeSnapshotSize',
      transforms: [sortable],
      props: { className: tableColumnInfo[2].className },
      id: tableColumnInfo[2].id,
    },
    {
      title: t('console-app~VolumeSnapshot'),
      sort: 'spec.volumeSnapshotRef.name',
      transforms: [sortable],
      props: { className: tableColumnInfo[3].className },
      id: tableColumnInfo[3].id,
    },
    {
      title: t('console-app~SnapshotClass'),
      sort: 'spec.volumeSnapshotClassName',
      transforms: [sortable],
      props: { className: tableColumnInfo[4].className },
      id: tableColumnInfo[4].id,
    },
    {
      title: t('console-app~Created at'),
      sort: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnInfo[5].className },
      id: tableColumnInfo[5].id,
    },
    {
      title: '',
      props: { className: tableColumnInfo[6].className },
      id: tableColumnInfo[6].id,
    },
  ];
  const [columns] = useActiveColumns({ columns: getTableColumns() });

  return (
    <VirtualizedTable<VolumeSnapshotContentKind>
      {...props}
      aria-label={t('console-app~VolumeSnapshotContents')}
      label={t('console-app~VolumeSnapshotContents')}
      columns={columns}
      Row={Row}
    />
  );
};

const VolumeSnapshotContentPage: React.FC<VolumeSnapshotContentPageProps> = ({
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

  const [data, filteredData, onFilterChange] = useListPageFilter(resources);
  const resourceKind = referenceForModel(VolumeSnapshotContentModel);
  return (
    <>
      <ListPageHeader title={showTitle ? t(VolumeSnapshotContentModel.labelPluralKey) : undefined}>
        {canCreate && (
          <ListPageCreate groupVersionKind={resourceKind}>
            {t('console-app~Create VolumeSnapshot')}
          </ListPageCreate>
        )}
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter
          data={data}
          loaded={loaded}
          onFilterChange={onFilterChange}
          rowFilters={snapshotStatusFilters(t)}
        />
        <VolumeSnapshotContentTable
          data={filteredData}
          unfilteredData={resources}
          loaded={loaded}
          loadError={loadError}
        />
      </ListPageBody>
    </>
  );
};

type VolumeSnapshotContentPageProps = {
  canCreate?: boolean;
} & PageComponentProps;

type VolumeSnapshotContentTableProps = {
  data: VolumeSnapshotContentKind[];
  unfilteredData: VolumeSnapshotContentKind[];
  loaded: boolean;
  loadError: any;
};

export default VolumeSnapshotContentPage;
