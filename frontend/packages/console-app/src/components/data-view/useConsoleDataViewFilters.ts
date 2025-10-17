import * as React from 'react';
import { useDataViewFilters } from '@patternfly/react-data-view';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { useExactSearch } from '@console/app/src/components/user-preferences/search/useExactSearch';
import {
  exactMatch,
  fuzzyCaseInsensitive,
} from '@console/internal/components/factory/table-filters';
import { getLabelsAsString } from '@console/shared/src/utils/label-filter';
import { ResourceFilters, GetResourceMetadata } from './types';

export const useConsoleDataViewFilters = <
  TData,
  TFilters extends ResourceFilters = ResourceFilters
>({
  data,
  initialFilters,
  getResourceMetadata,
  matchesAdditionalFilters,
}: {
  data: TData[];
  initialFilters: TFilters;
  getResourceMetadata?: GetResourceMetadata<TData>;
  matchesAdditionalFilters?: (resource: TData, filters: TFilters) => boolean;
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
      data.filter((resource) => {
        const resourceMetadata = getResourceMetadata?.(resource);

        // Filter by K8s resource name
        const resourceName = resourceMetadata?.name;
        const matchesName =
          !filters.name || isExactSearch
            ? exactMatch(filters.name, resourceName)
            : fuzzyCaseInsensitive(filters.name, resourceName);

        // Filter by K8s resource labels
        const resourceLabels = getLabelsAsString(resourceMetadata, 'labels');
        const filterLabelsArray = filters.label?.split(',') ?? [];
        const matchesLabels =
          !filters.label || filterLabelsArray.every((label) => resourceLabels.includes(label));

        return (
          matchesName && matchesLabels && (matchesAdditionalFilters?.(resource, filters) ?? true)
        );
      }),
    [data, filters, isExactSearch, getResourceMetadata, matchesAdditionalFilters],
  );

  return { filters, onSetFilters, clearAllFilters, filteredData };
};
