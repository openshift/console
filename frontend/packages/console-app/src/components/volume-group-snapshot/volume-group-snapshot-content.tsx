import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import * as classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import {
  ListPageBody,
  ListPageCreate,
  ListPageFilter,
  ListPageHeader,
  RowProps,
  TableColumn,
  useListPageFilter,
  VirtualizedTable,
} from '@console/dynamic-plugin-sdk/src/lib-core';
import { TableData } from '@console/internal/components/factory';
import { useActiveColumns } from '@console/internal/components/factory/Table/active-columns-hook';
import {
  Kebab,
  PageComponentProps,
  ResourceKebab,
  ResourceLink,
  Timestamp,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  VolumeGroupSnapshotClassModel,
  VolumeGroupSnapshotContentModel,
  VolumeGroupSnapshotModel,
} from '@console/internal/models';
import { referenceForModel, VolumeGroupSnapshotContentKind } from '@console/internal/module/k8s';
import { Status } from '@console/shared';
import { snapshotStatusFilters, volumeSnapshotStatus } from '../../status';

export const tableColumnInfo = [
  { id: 'name' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-lg'), id: 'status' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'volumeGroupSnapshot' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'groupSnapshotClass' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-2xl'), id: 'createdAt' },
  { className: Kebab.columnClass, id: '' },
];

const Row: React.FC<RowProps<VolumeGroupSnapshotContentKind>> = ({ obj }) => {
  const { name, creationTimestamp } = obj?.metadata || {};
  const { name: snapshotName, namespace: snapshotNamespace } =
    obj?.spec?.volumeGroupSnapshotRef || {};

  return (
    <>
      <TableData {...tableColumnInfo[0]}>
        <ResourceLink kind={referenceForModel(VolumeGroupSnapshotContentModel)} name={name} />
      </TableData>
      <TableData {...tableColumnInfo[1]}>
        <Status status={volumeSnapshotStatus(obj)} />
      </TableData>
      <TableData {...tableColumnInfo[2]}>
        <ResourceLink
          kind={referenceForModel(VolumeGroupSnapshotModel)}
          name={snapshotName}
          namespace={snapshotNamespace}
        />
      </TableData>
      <TableData {...tableColumnInfo[3]}>
        <ResourceLink
          kind={referenceForModel(VolumeGroupSnapshotClassModel)}
          name={obj?.spec?.volumeGroupSnapshotClassName}
        />
      </TableData>
      <TableData {...tableColumnInfo[4]}>
        <Timestamp timestamp={creationTimestamp} />
      </TableData>
      <TableData {...tableColumnInfo[5]}>
        <ResourceKebab
          kind={referenceForModel(VolumeGroupSnapshotContentModel)}
          resource={obj}
          actions={Kebab.factory.common}
        />
      </TableData>
    </>
  );
};

const VolumeGroupSnapshotContentTable: React.FC<VolumeGroupSnapshotContentTableProps> = (props) => {
  const { t } = useTranslation();
  const getTableColumns = (): TableColumn<VolumeGroupSnapshotContentKind>[] => [
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
      title: t('console-app~VolumeGroupSnapshot'),
      sort: 'spec.volumeGroupSnapshotRef.name',
      transforms: [sortable],
      props: { className: tableColumnInfo[2].className },
      id: tableColumnInfo[2].id,
    },
    {
      title: t('console-app~SnapshotClass'),
      sort: 'spec.volumeGroupSnapshotClassName',
      transforms: [sortable],
      props: { className: tableColumnInfo[3].className },
      id: tableColumnInfo[3].id,
    },
    {
      title: t('console-app~Created at'),
      sort: 'metadata.creationTimestamp',
      transforms: [sortable],
      props: { className: tableColumnInfo[4].className },
      id: tableColumnInfo[4].id,
    },
    {
      title: '',
      props: { className: tableColumnInfo[5].className },
      id: tableColumnInfo[5].id,
    },
  ];
  const [columns] = useActiveColumns({ columns: getTableColumns() });

  return (
    <VirtualizedTable<VolumeGroupSnapshotContentKind>
      {...props}
      aria-label={t('console-app~VolumeGroupSnapshotContents')}
      label={t('console-app~VolumeGroupSnapshotContents')}
      columns={columns}
      Row={Row}
    />
  );
};

const VolumeGroupSnapshotContentPage: React.FC<VolumeGroupSnapshotContentPageProps> = ({
  showTitle = true,
  canCreate = true,
}) => {
  const { t } = useTranslation();

  const [resources, loaded, loadError] = useK8sWatchResource<VolumeGroupSnapshotContentKind[]>({
    groupVersionKind: {
      group: VolumeGroupSnapshotContentModel.apiGroup,
      kind: VolumeGroupSnapshotContentModel.kind,
      version: VolumeGroupSnapshotContentModel.apiVersion,
    },
    isList: true,
  });

  const [data, filteredData, onFilterChange] = useListPageFilter(resources);
  const resourceKind = referenceForModel(VolumeGroupSnapshotContentModel);
  return (
    <>
      <ListPageHeader
        title={showTitle ? t(VolumeGroupSnapshotContentModel.labelPluralKey) : undefined}
      >
        {canCreate && (
          <ListPageCreate groupVersionKind={resourceKind}>
            {t('console-app~Create VolumeGroupSnapshotContent')}
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
        <VolumeGroupSnapshotContentTable
          data={filteredData}
          unfilteredData={resources}
          loaded={loaded}
          loadError={loadError}
        />
      </ListPageBody>
    </>
  );
};

type VolumeGroupSnapshotContentPageProps = {
  canCreate?: boolean;
} & PageComponentProps;

type VolumeGroupSnapshotContentTableProps = {
  data: VolumeGroupSnapshotContentKind[];
  unfilteredData: VolumeGroupSnapshotContentKind[];
  loaded: boolean;
  loadError: any;
};

export default VolumeGroupSnapshotContentPage;
