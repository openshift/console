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
import { Kebab, ResourceLink } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { VolumeGroupSnapshotClassModel } from '@console/internal/models';
import {
  referenceFor,
  referenceForModel,
  Selector,
  VolumeGroupSnapshotClassKind,
} from '@console/internal/module/k8s';
import { getAnnotations, LazyActionMenu } from '@console/shared';

const tableColumnInfo = [
  { id: 'name' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-md'), id: 'driver' },
  { className: classNames('pf-m-hidden', 'pf-m-visible-on-md'), id: 'deletionPolicy' },
  { className: Kebab.columnClass, id: '' },
];

const defaultSnapshotClassAnnotation: string = 'snapshot.storage.kubernetes.io/is-default-class';
export const isDefaultSnapshotClass = (VolumeGroupSnapshotClass: VolumeGroupSnapshotClassKind) =>
  getAnnotations(VolumeGroupSnapshotClass, { defaultSnapshotClassAnnotation: 'false' })[
    defaultSnapshotClassAnnotation
  ] === 'true';

const Row: React.FC<RowProps<VolumeGroupSnapshotClassKind>> = ({ obj }) => {
  const { name } = obj?.metadata || {};
  const { deletionPolicy, driver } = obj || {};
  const { t } = useTranslation();
  const resourceKind = referenceFor(obj);
  const context = { [resourceKind]: obj };

  return (
    <>
      <TableData {...tableColumnInfo[0]}>
        <ResourceLink name={name} kind={referenceForModel(VolumeGroupSnapshotClassModel)}>
          {isDefaultSnapshotClass(obj) && (
            <span className="small text-muted co-resource-item__help-text">
              {t('public~Default')}
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

const VolumeGroupSnapshotClassTable: React.FC<VolumeGroupSnapshotClassTableProps> = (props) => {
  const { t } = useTranslation();
  const getTableColumns = (): TableColumn<VolumeGroupSnapshotClassKind>[] => [
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
    <VirtualizedTable<VolumeGroupSnapshotClassKind>
      {...props}
      aria-label={t('console-app~VolumeGroupSnapshotClasses')}
      label={t('console-app~VolumeGroupSnapshotClasses')}
      columns={columns}
      Row={Row}
    />
  );
};

const VolumeGroupSnapshotClassPage: React.FC<VolumeGroupSnapshotClassPageProps> = ({
  canCreate = true,
  showTitle = true,
  namespace,
  selector,
}) => {
  const { t } = useTranslation();
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
  const [data, filteredData, onFilterChange] = useListPageFilter(resources);
  const resourceKind = referenceForModel(VolumeGroupSnapshotClassModel);

  return (
    <>
      <ListPageHeader
        title={showTitle ? t(VolumeGroupSnapshotClassModel.labelPluralKey) : undefined}
      >
        {canCreate && (
          <ListPageCreate groupVersionKind={resourceKind}>
            {t('console-app~Create VolumeGroupSnapshotClass')}
          </ListPageCreate>
        )}
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter data={data} loaded={loaded} onFilterChange={onFilterChange} />
        <VolumeGroupSnapshotClassTable
          unfilteredData={resources}
          data={filteredData}
          loaded={loaded}
          loadError={loadError}
        />
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
  unfilteredData: VolumeGroupSnapshotClassKind[];
  loaded: boolean;
  loadError: any;
};
export default VolumeGroupSnapshotClassPage;
