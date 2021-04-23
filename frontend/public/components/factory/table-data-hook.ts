import * as React from 'react';
import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { createSelectorCreator, defaultMemoize } from 'reselect';
import { SortByDirection } from '@patternfly/react-table';
import { useDeepCompareMemoize } from '@console/shared';

import { RootState } from '../../redux';
import { tableFilters } from './table-filters';
import { RowFilter } from '../filter-toolbar';
import { Filter } from './table';

export const getFilteredRows = <D = any>(
  filters: Filter[],
  rowFilters: RowFilter[],
  objects: D[],
) => {
  if (_.isEmpty(filters)) {
    return objects;
  }

  const allTableFilters = {
    ...tableFilters,
    ...(rowFilters || [])
      .filter((f) => f.type && _.isFunction(f.filter))
      .reduce((acc, f) => ({ ...acc, [f.type]: f.filter }), {}),
  };
  let filteredObjects = objects;
  _.each(filters, (value, name) => {
    const filter = allTableFilters[name];
    if (_.isFunction(filter)) {
      filteredObjects = _.filter(filteredObjects, (o) => filter(value, o));
    }
  });

  return filteredObjects;
};

type UseTableDataProps<D = any, C = any> = {
  reduxID: string;
  reduxIDs: string[];
  defaultSortFunc: string;
  defaultSortField: string;
  defaultSortOrder: SortByDirection;
  staticFilters: { key: string; value: string }[];
  filters: { key: string; value: string }[];
  rowFilters: RowFilter[];
  propData: D[];
  loaded: boolean;
  isPinned: (obj: D) => boolean;
  customData: C;
  customSorts: { [key: string]: (obj: D) => number | string };
  sorts: { [key: string]: any };
};

type UseTableDataResult<D = any> = {
  currentSortField: string;
  currentSortFunc: string;
  currentSortOrder: SortByDirection;
  data: D[];
  listId: string;
};

export const useTableData = ({
  reduxID,
  reduxIDs,
  defaultSortFunc,
  defaultSortField = 'metadata.name',
  defaultSortOrder = SortByDirection.asc,
  staticFilters: initStaticFilters,
  filters,
  rowFilters: initRowFilters,
  propData,
  loaded,
  isPinned,
  customData: initCustomData,
  customSorts: initCustomSorts,
  sorts: initSorts,
}: UseTableDataProps): UseTableDataResult => {
  const [staticFilters, rowFilters, customSorts, sorts, customData] = useDeepCompareMemoize([
    initStaticFilters,
    initRowFilters,
    initCustomSorts,
    initSorts,
    initCustomData,
  ]);

  const tableSelectorCreator = React.useMemo(
    () =>
      createSelectorCreator(
        defaultMemoize as any,
        (oldSortState, newSortState) => oldSortState === newSortState,
      ),
    [],
  );

  const listId = reduxIDs ? reduxIDs.join(',') : reduxID;

  const sortSelector = React.useMemo(
    () =>
      tableSelectorCreator(
        (state: RootState) => state.UI.getIn(['listSorts', listId]),
        (sortsState: any) => [
          sortsState?.get('field'),
          sortsState?.get('func'),
          sortsState?.get('orderBy'),
        ],
      ),
    [tableSelectorCreator, listId],
  );

  const [
    currentSortField = defaultSortFunc ? undefined : defaultSortField,
    currentSortFunc = defaultSortFunc,
    currentSortOrder = defaultSortOrder,
  ] = useSelector(sortSelector);

  return React.useMemo(() => {
    const allFilters = staticFilters ? Object.assign({}, filters, ...staticFilters) : filters;
    const data = getFilteredRows(allFilters, rowFilters, propData);

    if (loaded) {
      let sortBy: string | Function = 'metadata.name';
      if (currentSortField) {
        sortBy = (resource) => sorts.string(_.get(resource, currentSortField, ''));
      } else if (currentSortFunc && customSorts?.[currentSortFunc]) {
        // Sort resources by a function in the 'customSorts' prop
        sortBy = customSorts[currentSortFunc];
      } else if (currentSortFunc && sorts[currentSortFunc]) {
        // Sort resources by a function in the 'sorts' object
        sortBy = sorts[currentSortFunc];
      }

      const getSortValue = (resource) => {
        const val = _.isFunction(sortBy)
          ? sortBy(resource, customData)
          : _.get(resource, sortBy as string);
        return val ?? '';
      };
      data?.sort((a, b) => {
        const lang = navigator.languages[0] || navigator.language;
        // Use `localCompare` with `numeric: true` for a natural sort order (e.g., pv-1, pv-9, pv-10)
        const compareOpts = { numeric: true, ignorePunctuation: true };
        const aValue = getSortValue(a);
        const bValue = getSortValue(b);
        const aPinned = isPinned?.(a);
        const bPinned = isPinned?.(b);
        if (aPinned !== bPinned) {
          return aPinned ? -1 : +1;
        }
        const result: number =
          Number.isFinite(aValue) && Number.isFinite(bValue)
            ? aValue - bValue
            : `${aValue}`.localeCompare(`${bValue}`, lang, compareOpts);
        if (result !== 0) {
          return currentSortOrder === SortByDirection.asc ? result : result * -1;
        }

        // Use name as a secondary sort for a stable sort.
        const aName = a?.metadata?.name || '';
        const bName = b?.metadata?.name || '';
        return aName.localeCompare(bName, lang, compareOpts);
      });
    }

    return {
      currentSortField,
      currentSortFunc,
      currentSortOrder,
      data,
      listId,
    };
  }, [
    currentSortField,
    currentSortFunc,
    currentSortOrder,
    customData,
    customSorts,
    filters,
    isPinned,
    listId,
    loaded,
    propData,
    rowFilters,
    sorts,
    staticFilters,
  ]);
};
