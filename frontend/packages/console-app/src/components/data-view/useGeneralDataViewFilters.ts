import * as React from 'react';
import { useDataViewFilters } from '@patternfly/react-data-view';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { useExactSearch } from '@console/app/src/components/user-preferences/search/useExactSearch';
import {
  exactMatch,
  fuzzyCaseInsensitive,
} from '@console/internal/components/factory/table-filters';
import { GeneralFilters } from './types';

export const useGeneralDataViewFilters = <
  TData = any,
  TFilters extends GeneralFilters = GeneralFilters
>({
  data,
  initialFilters,
  matchesAdditionalFilters,
  getNameFromItem,
  getLabelsAsString,
}: {
  data: TData[];
  initialFilters: TFilters;
  matchesAdditionalFilters?: (resource: TData, filters: TFilters) => boolean;
  getNameFromItem?: (item: TData) => string;
  getLabelsAsString?: (item: TData) => string;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExactSearch] = useExactSearch();

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<TFilters>({
    initialFilters,
    searchParams,
    setSearchParams,
  });

  const filteredData = React.useMemo(
    () =>
      data.filter((item) => {
        // Filter by item name
        const itemName = getNameFromItem?.(item) || '';
        const matchesName =
          !filters.name || !getNameFromItem
            ? true // If no name getter provided, don't filter by name
            : isExactSearch
            ? exactMatch(filters.name, itemName)
            : fuzzyCaseInsensitive(filters.name, itemName);

        // Filter by item labels
        const itemLabels = getLabelsAsString?.(item) || '';
        const filterLabelsArray = filters.label?.split(',') ?? [];
        const matchesLabels =
          !filters.label || !getLabelsAsString
            ? true // If no label getter provided, don't filter by labels
            : filterLabelsArray.every((label) => itemLabels.includes(label));

        return matchesName && matchesLabels && (matchesAdditionalFilters?.(item, filters) ?? true);
      }),
    [data, filters, isExactSearch, matchesAdditionalFilters, getNameFromItem, getLabelsAsString],
  );

  return { filters, onSetFilters, clearAllFilters, filteredData };
};
