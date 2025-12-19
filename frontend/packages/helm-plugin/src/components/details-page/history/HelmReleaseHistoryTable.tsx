import type { MouseEvent, FC } from 'react';
import { useMemo, useCallback, Suspense } from 'react';
import { Pagination } from '@patternfly/react-core';
import {
  DataView,
  DataViewTable,
  DataViewTd,
  DataViewTh,
  DataViewToolbar,
  useDataViewPagination,
} from '@patternfly/react-data-view';
import { InnerScrollContainer, SortByDirection } from '@patternfly/react-table';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { LoadingBox } from '@console/internal/components/utils';
import { HelmRelease } from '../../../types/helm-types';
import {
  useRevisionListColumns,
  getColumnIndexById,
} from '../../forms/rollback/RevisionListHeader';
import { getRevisionRows } from '../../forms/rollback/RevisionListRow';

export interface HelmReleaseHistoryTableProps {
  releaseHistory: HelmRelease[];
  isLoading?: boolean;
  customColumns?: (
    sortBy: { index: number; direction: SortByDirection },
    onSort: (event: MouseEvent, columnId: string, direction: SortByDirection) => void,
  ) => DataViewTh[];
  customRowRenderer?: (releaseHistory: HelmRelease[]) => DataViewTd[][];
  customGetColumnIndexById?: (columnId: string) => number;
  customSortFunctions?: Record<number, (release: HelmRelease) => any>;
}

const HelmReleaseHistoryTable: FC<HelmReleaseHistoryTableProps> = ({
  releaseHistory,
  isLoading = false,
  customColumns,
  customRowRenderer,
  customGetColumnIndexById,
  customSortFunctions,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize pagination
  const pagination = useDataViewPagination({
    perPage: 50,
    searchParams,
    setSearchParams,
  });

  const getColumnIndex = customGetColumnIndexById || getColumnIndexById;

  // Get sort state from query parameters
  const sortBy = useMemo(() => {
    const sortByParam = searchParams.get('sortBy');
    const sortDirection = searchParams.get('sortDirection');

    return {
      index: sortByParam ? getColumnIndex(sortByParam) : customGetColumnIndexById ? 0 : 1, // Default to revision column (index varies by implementation)
      direction: sortDirection === 'asc' ? SortByDirection.asc : SortByDirection.desc,
    };
  }, [searchParams, getColumnIndex, customGetColumnIndexById]);

  // Sort handler - updates query parameters
  const onSort = useCallback(
    (_event: MouseEvent, columnId: string, direction: SortByDirection) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set('sortBy', columnId);
        newParams.set('sortDirection', direction === SortByDirection.asc ? 'asc' : 'desc');
        return newParams;
      });
    },
    [setSearchParams],
  );

  const defaultColumns = useRevisionListColumns(sortBy, onSort);
  const columns = customColumns ? customColumns(sortBy, onSort) : defaultColumns;

  // Sort the release history based on the selected column
  const sortedReleaseHistory = useMemo(() => {
    if (!releaseHistory) return [];

    const defaultSortFunctions: Record<number, (release: HelmRelease) => any> = {
      0: (r) => r.version, // Revision (for history view)
      1: (r) => (customGetColumnIndexById ? new Date(r.info.last_deployed).getTime() : r.version), // Updated or Revision (for rollback form)
      2: (r) =>
        customGetColumnIndexById ? r.info.status : new Date(r.info.last_deployed).getTime(), // Status or Updated
      3: (r) => (customGetColumnIndexById ? r.chart.metadata.name : r.info.status), // Chart name or Status
      4: (r) => (customGetColumnIndexById ? r.chart.metadata.version : r.chart.metadata.name), // Chart version or Chart name
      5: (r) =>
        customGetColumnIndexById ? r.chart.metadata.appVersion || '' : r.chart.metadata.version, // App version or Chart version
      6: (r) => r.chart.metadata.appVersion || '', // App version
    };

    const sortFunctions = customSortFunctions || defaultSortFunctions;
    const getSortValue = sortFunctions[sortBy.index];
    if (!getSortValue) return releaseHistory;

    const sorted = [...releaseHistory];
    const sortDirection = sortBy.direction === SortByDirection.asc ? 1 : -1;

    sorted.sort((a, b) => {
      const aValue = getSortValue(a);
      const bValue = getSortValue(b);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * sortDirection;
      }
      return (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) * sortDirection;
    });

    return sorted;
  }, [releaseHistory, sortBy, customSortFunctions, customGetColumnIndexById]);

  const defaultRowRenderer = useCallback(
    (history: HelmRelease[]) => getRevisionRows(history),
    [],
  );

  const rowRenderer = customRowRenderer || defaultRowRenderer;

  // Apply pagination by slicing the sorted data
  const paginatedReleaseHistory = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.perPage;
    const endIndex = startIndex + pagination.perPage;
    return sortedReleaseHistory.slice(startIndex, endIndex);
  }, [sortedReleaseHistory, pagination.page, pagination.perPage]);

  const rows = useMemo(() => rowRenderer(paginatedReleaseHistory), [
    rowRenderer,
    paginatedReleaseHistory,
  ]);

  return (
    (<Suspense fallback={<LoadingBox />}>
      {isLoading || !releaseHistory ? (
        <LoadingBox />
      ) : (
        <DataView>
          <DataViewToolbar
            pagination={
              <Pagination
                itemCount={sortedReleaseHistory.length}
                perPage={pagination.perPage}
                page={pagination.page}
                onSetPage={pagination.onSetPage}
                onPerPageSelect={pagination.onPerPageSelect}
                isCompact
              />
            }
          />
          <InnerScrollContainer>
            <DataViewTable
              variant="compact"
              columns={columns}
              rows={rows}
              gridBreakPoint=""
              data-test="helm-revision-list"
            />
          </InnerScrollContainer>
        </DataView>
      )}
    </Suspense>)
  );
};

export default HelmReleaseHistoryTable;
