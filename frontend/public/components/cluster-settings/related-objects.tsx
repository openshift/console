import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  DataViewTextFilter,
  DataViewState,
  useDataViewSort,
  useDataViewFilters,
  useDataViewPagination,
} from '@patternfly/react-data-view';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { Pagination } from '@patternfly/react-core';
import { InnerScrollContainer } from '@patternfly/react-table';
import { useSearchParams } from 'react-router-dom-v5-compat';
import {
  referenceForModel,
  ClusterOperator,
  ClusterOperatorObjectReference,
  useModelFinder,
} from '../../module/k8s';
import { ResourceLink } from '../utils';
import { DASH } from '@console/shared/src/constants';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import {
  getNameCellProps,
  BodyLoading,
  BodyEmpty,
  cellIsStickyProps,
} from '@console/app/src/components/data-view/ResourceDataView';

const columnIds = [{ id: 'name' }, { id: 'resource' }, { id: 'group' }, { id: 'namespace' }];

const ResourceObjectName: React.FC<ResourceObjectNameProps> = ({ gsv, name, namespace }) => {
  if (!name) {
    return <>{DASH}</>;
  }
  if (gsv) {
    return <ResourceLink kind={gsv} name={name} namespace={namespace} />;
  }
  return <>{name}</>;
};

const getDataViewRows = (data: ClusterOperatorObjectReference[], findModel: any) => {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.map((obj) => {
    const { name, resource, namespace, group } = obj;
    const model = findModel(group, resource);
    const gsv = model ? referenceForModel(model) : null;

    const rowCells = {
      [columnIds[0].id]: {
        cell: <ResourceObjectName gsv={gsv} name={name} namespace={namespace} />,
        props: getNameCellProps(name),
      },
      [columnIds[1].id]: {
        cell: resource,
      },
      [columnIds[2].id]: {
        cell: group || DASH,
      },
      [columnIds[3].id]: {
        cell: namespace ? <ResourceLink kind="Namespace" name={namespace} /> : DASH,
      },
    };

    return columnIds.map(({ id }) => ({
      id,
      cell: rowCells[id].cell,
      props: rowCells[id].props,
    }));
  });
};

const RelatedObjects: React.FC<RelatedObjectsProps> = ({ data }) => {
  const { findModel } = useModelFinder();
  const { t } = useTranslation();

  const [searchParams, setSearchParams] = useSearchParams();
  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<RelatedObjectsFilters>({
    initialFilters: { name: '' },
    searchParams,
    setSearchParams,
  });

  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: { sortBy: 'name', direction: 'asc' },
  });

  const pagination = useDataViewPagination({
    perPage: 50,
    searchParams,
    setSearchParams,
  });

  const getSortParams = React.useCallback(
    (columnIndex: number, columnKey: string) => {
      const currentSortBy = sortBy || 'name';
      const currentDirection = direction || 'asc';

      return {
        sortBy: {
          index: currentSortBy === columnKey ? 0 : -1,
          direction: currentDirection,
          defaultDirection: 'asc' as const,
        },
        onSort: (
          _event: React.MouseEvent | React.KeyboardEvent,
          index: number,
          sortDirection: 'asc' | 'desc',
        ) => onSort(_event, columnKey, sortDirection),
        columnIndex,
      };
    },
    [sortBy, direction, onSort],
  );

  const columns = React.useMemo(
    () => [
      {
        cell: t('public~Name'),
        props: {
          ...cellIsStickyProps,
          modifier: 'nowrap',
          sort: getSortParams(0, 'name'),
        },
      },
      {
        cell: t('public~Resource'),
        props: {
          modifier: 'nowrap',
          sort: getSortParams(1, 'resource'),
        },
      },
      {
        cell: t('public~Group'),
        props: {
          modifier: 'nowrap',
          sort: getSortParams(2, 'group'),
        },
      },
      {
        cell: t('public~Namespace'),
        props: {
          modifier: 'nowrap',
          sort: getSortParams(3, 'namespace'),
        },
      },
    ],
    [t, getSortParams],
  );

  const filteredData = React.useMemo(() => {
    let result = data;

    if (filters.name) {
      result = result.filter((item) =>
        item.name?.toLowerCase().includes(filters.name.toLowerCase()),
      );
    }

    const sortDirection = direction || 'asc';
    const sortColumn = sortBy || 'name';

    if (sortColumn) {
      result = [...result].sort((a, b) => {
        const aValue = (a[sortColumn as keyof ClusterOperatorObjectReference] || '').toLowerCase();
        const bValue = (b[sortColumn as keyof ClusterOperatorObjectReference] || '').toLowerCase();
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters.name, sortBy, direction]);

  // Reset pagination to page 1 when filters change
  React.useEffect(() => {
    if (pagination.page > 1) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('page', '1');
        return newParams;
      });
    }
  }, [filters.name, pagination.page, setSearchParams]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.perPage;
    return filteredData.slice(startIndex, startIndex + pagination.perPage);
  }, [filteredData, pagination.page, pagination.perPage]);

  const rows = React.useMemo(() => {
    if (!Array.isArray(paginatedData)) {
      return [];
    }
    return getDataViewRows(paginatedData, findModel);
  }, [paginatedData, findModel]);

  const bodyLoading = React.useMemo(() => <BodyLoading columns={columns.length} />, [
    columns.length,
  ]);

  const bodyEmpty = React.useMemo(
    () => <BodyEmpty label={t('public~Related objects')} colSpan={columns.length} />,
    [columns.length, t],
  );

  const activeState = React.useMemo(() => {
    if (filteredData.length === 0) {
      return DataViewState.empty;
    }
    return undefined;
  }, [filteredData.length]);

  return (
    <DataView activeState={activeState}>
      <DataViewToolbar
        filters={
          <DataViewFilters values={filters} onChange={(_e, values) => onSetFilters(values)}>
            <DataViewTextFilter
              filterId="name"
              title={t('public~Name')}
              placeholder={t('public~Filter by name')}
            />
          </DataViewFilters>
        }
        clearAllFilters={clearAllFilters}
        pagination={
          <Pagination
            itemCount={filteredData.length}
            page={pagination.page}
            perPage={pagination.perPage}
            onSetPage={pagination.onSetPage}
            onPerPageSelect={pagination.onPerPageSelect}
          />
        }
      />
      <InnerScrollContainer>
        <DataViewTable
          aria-label={t('public~Related objects table')}
          columns={columns}
          rows={rows}
          bodyStates={{ empty: bodyEmpty, loading: bodyLoading }}
          gridBreakPoint=""
          variant="compact"
          data-test="data-view-table"
        />
      </InnerScrollContainer>
    </DataView>
  );
};

const RelatedObjectsPage: React.FC<RelatedObjectsPageProps> = (props) => {
  const relatedObject: ClusterOperatorObjectReference[] = props.obj?.status?.relatedObjects;
  const data: ClusterOperatorObjectReference[] =
    relatedObject?.filter(({ resource }) => resource) || [];
  return (
    <PaneBody>
      <RelatedObjects data={data} />
    </PaneBody>
  );
};

export default RelatedObjectsPage;

type ResourceObjectNameProps = {
  gsv: string;
  name: string;
  namespace: string;
};

type RelatedObjectsPageProps = {
  obj: ClusterOperator;
};

type RelatedObjectsProps = {
  data: ClusterOperatorObjectReference[];
};

type RelatedObjectsFilters = {
  name: string;
};
