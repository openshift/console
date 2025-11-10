import * as React from 'react';
import { css } from '@patternfly/react-styles';
import { sortable } from '@patternfly/react-table';
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
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { VolumeSnapshotClassModel } from '@console/internal/models';
import {
  referenceForModel,
  VolumeSnapshotClassKind,
  Selector,
  referenceFor,
} from '@console/internal/module/k8s';
import LazyActionMenu from '@console/shared/src/components/actions/LazyActionMenu';
import { getAnnotations } from '@console/shared/src/selectors/common';

const tableColumnInfo = [
  { id: 'name' },
  { className: css('pf-m-hidden', 'pf-m-visible-on-md'), id: 'driver' },
  { className: css('pf-m-hidden', 'pf-m-visible-on-md'), id: 'deletionPolicy' },
  { className: Kebab.columnClass, id: '' },
];

const defaultSnapshotClassAnnotation: string = 'snapshot.storage.kubernetes.io/is-default-class';
export const isDefaultSnapshotClass = (volumeSnapshotClass: VolumeSnapshotClassKind) =>
  getAnnotations(volumeSnapshotClass, { defaultSnapshotClassAnnotation: 'false' })[
    defaultSnapshotClassAnnotation
  ] === 'true';

const Row: React.FC<RowProps<VolumeSnapshotClassKind>> = ({ obj }) => {
  const { name } = obj?.metadata || {};
  const { deletionPolicy, driver } = obj || {};
  const resourceKind = referenceFor(obj);
  const context = { [resourceKind]: obj };
  return (
    <>
      <TableData {...tableColumnInfo[0]}>
        <ResourceLink name={name} kind={referenceForModel(VolumeSnapshotClassModel)}>
          {isDefaultSnapshotClass(obj) && (
            <span className="pf-v6-u-font-size-xs pf-v6-u-text-color-subtle co-resource-item__help-text">
              &ndash; Default
            </span>
          )}
        </ResourceLink>
      </TableData>
      <TableData {...tableColumnInfo[1]}>{driver}</TableData>
      <TableData {...tableColumnInfo[2]}>{deletionPolicy}</TableData>
      <TableData {...tableColumnInfo[3]}>
        <LazyActionMenu context={context} />
      </TableData>
    </>
  );
};

const VolumeSnapshotClassTable: React.FC<VolumeSnapshotClassTableProps> = (props) => {
  const { t } = useTranslation();
  const getTableColumns = (): TableColumn<VolumeSnapshotClassKind>[] => [
    {
      title: t('console-app~Name'),
      sort: 'metadata.name',
      transforms: [sortable],
      id: tableColumnInfo[0].id,
    },
    {
      title: t('console-app~Driver'),
      sort: 'driver',
      transforms: [sortable],
      props: { className: tableColumnInfo[1].className },
      id: tableColumnInfo[1].id,
    },
    {
      title: t('console-app~Deletion policy'),
      sort: 'deletionPolicy',
      transforms: [sortable],
      props: { className: tableColumnInfo[2].className },
      id: tableColumnInfo[2].id,
    },
    {
      title: '',
      props: { className: tableColumnInfo[3].className },
      id: tableColumnInfo[3].id,
    },
  ];
  const [columns] = useActiveColumns({ columns: getTableColumns() });

  return (
    <VirtualizedTable<VolumeSnapshotClassKind>
      {...props}
      aria-label={t('console-app~VolumeSnapshotClasses')}
      label={t('console-app~VolumeSnapshotClasses')}
      columns={columns}
      Row={Row}
    />
  );
};

const VolumeSnapshotClassPage: React.FC<VolumeSnapshotClassPageProps> = ({
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
  const [data, filteredData, onFilterChange] = useListPageFilter(resources);
  const resourceKind = referenceForModel(VolumeSnapshotClassModel);

  return (
    <>
      <ListPageHeader title={showTitle ? t(VolumeSnapshotClassModel.labelPluralKey || '') : ''}>
        {canCreate && (
          <ListPageCreate groupVersionKind={resourceKind}>
            {t('console-app~Create VolumeSnapshotClass')}
          </ListPageCreate>
        )}
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <VolumeSnapshotClassTable
          unfilteredData={resources}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
        />
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
  unfilteredData: VolumeSnapshotClassKind[];
  loaded: boolean;
  loadError: unknown;
};
export default VolumeSnapshotClassPage;
