import * as React from 'react';
import {
  ListPageHeader,
  ListPageBody,
  ListPageCreate,
  VirtualizedTable,
  useK8sWatchResource,
  useListPageFilter,
  K8sResourceCommon,
  ListPageFilter,
  RowFilter,
  TableData,
  RowProps,
  ResourceLink,
  TableColumn,
} from '@openshift-console/dynamic-plugin-sdk';

const columns: TableColumn<K8sResourceCommon>[] = [
  {
    title: 'Name',
    id: 'name',
  },
  {
    title: 'Namespace',
    id: 'namespace',
  },
];

const PodRow: React.FC<RowProps<K8sResourceCommon>> = ({ obj, activeColumnIDs }) => {
  return (
    <>
      <TableData id={columns[0].id} activeColumnIDs={activeColumnIDs}>
        <ResourceLink kind="Pod" name={obj.metadata.name} namespace={obj.metadata.namespace} />
      </TableData>
      <TableData id={columns[1].id} activeColumnIDs={activeColumnIDs}>
        <ResourceLink kind="Namespace" name={obj.metadata.namespace} />
      </TableData>
    </>
  );
};

type PodsTableProps = {
  data: K8sResourceCommon[];
  unfilteredData: K8sResourceCommon[];
  loaded: boolean;
  loadError: any;
};

const PodsTable: React.FC<PodsTableProps> = ({ data, unfilteredData, loaded, loadError }) => {
  return (
    <VirtualizedTable<K8sResourceCommon>
      data={data}
      unfilteredData={unfilteredData}
      loaded={loaded}
      loadError={loadError}
      columns={columns}
      Row={PodRow}
    />
  );
};

export const filters: RowFilter[] = [
  {
    filterGroupName: 'App type',
    type: 'pod-app',
    reducer: (pod) => (pod.metadata.name.includes('kube-scheduler') ? 'scheduler' : 'other'),
    filter: (input, pod) => {
      if (input.selected?.length) {
        if (pod.metadata.name.includes('kube-scheduler')) {
          return input.selected.includes('scheduler');
        }
        if (!pod.metadata.name.includes('kube-scheduler')) {
          return input.selected.includes('other');
        }
      }
      return true;
    },
    items: [
      { id: 'scheduler', title: 'Scheduler pods' },
      { id: 'other', title: 'Other pods' },
    ],
  },
];

const ListPage = () => {
  const [pods, loaded, loadError] = useK8sWatchResource<K8sResourceCommon[]>({
    groupVersionKind: {
      version: 'v1',
      kind: 'Pod',
    },
    isList: true,
    namespaced: true,
  });

  const [data, filteredData, onFilterChange] = useListPageFilter(pods, filters, {
    name: { selected: ['openshift'] },
  });

  return (
    <>
      <ListPageHeader title="OpenShift Pods List Page">
        <ListPageCreate groupVersionKind="Pod">Create Pod</ListPageCreate>
      </ListPageHeader>
      <ListPageBody>
        <ListPageFilter
          data={data}
          loaded={loaded}
          rowFilters={filters}
          onFilterChange={onFilterChange}
        />
        <PodsTable
          data={filteredData}
          unfilteredData={data}
          loaded={loaded}
          loadError={loadError}
        />
      </ListPageBody>
    </>
  );
};

export default ListPage;
