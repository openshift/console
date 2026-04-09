import { useEffect, useMemo, useRef } from 'react';
import { useDataViewFilters } from '@patternfly/react-data-view';
import { useSearchParams } from 'react-router';
import { useExactSearch } from '@console/app/src/components/user-preferences/search/useExactSearch';
import type { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  exactMatch,
  fuzzyCaseInsensitive,
} from '@console/internal/components/factory/table-filters';
import { mapLabelsToStrings } from '@console/shared/src/utils/label-filter';
import type { ResourceFilters, ResourceMetadata } from './types';

const getK8sResourceMetadata = (obj: K8sResourceCommon): ResourceMetadata => ({
  name: obj.metadata?.name,
  labels: obj.metadata?.labels,
});

export const useConsoleDataViewFilters = <
  TData,
  TFilters extends ResourceFilters = ResourceFilters
>({
  data,
  initialFilters,
  getObjectMetadata = getK8sResourceMetadata,
  matchesAdditionalFilters,
}: {
  data: TData[];
  initialFilters: TFilters;
  getObjectMetadata?: (obj: TData) => ResourceMetadata;
  matchesAdditionalFilters?: (obj: TData, filters: TFilters) => boolean;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isExactSearch] = useExactSearch();

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<TFilters>({
    initialFilters,
    searchParams,
    setSearchParams,
  });

  // Sync URL search params → internal filter state.
  // useDataViewFilters only reads searchParams on mount (empty deps useEffect).
  // This effect ensures filters stay in sync when the URL changes externally
  // (e.g., the Search page updating query params without remounting).
  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  useEffect(() => {
    const updates: Partial<TFilters> = {};
    let hasChanges = false;
    for (const key of Object.keys(filtersRef.current)) {
      const currentValue = filtersRef.current[key];
      if (Array.isArray(currentValue)) {
        const urlValues = searchParams.getAll(key);
        if (
          urlValues.length !== currentValue.length ||
          urlValues.some((v, i) => v !== currentValue[i])
        ) {
          updates[key] = urlValues;
          hasChanges = true;
        }
      } else {
        const urlValue = searchParams.get(key) ?? '';
        if (urlValue !== currentValue) {
          updates[key] = urlValue;
          hasChanges = true;
        }
      }
    }
    if (hasChanges) {
      onSetFilters(updates as TFilters);
    }
  }, [searchParams, onSetFilters]);

  const filteredData = useMemo(
    () =>
      data?.filter((resource) => {
        const { name: resourceName, labels } = getObjectMetadata(resource);

        // Filter by K8s resource name
        const matchesName =
          !filters.name || isExactSearch
            ? exactMatch(filters.name, resourceName)
            : fuzzyCaseInsensitive(filters.name, resourceName);

        const resourceLabels = mapLabelsToStrings(labels);
        const filterLabelsArray = filters.label?.split(',') ?? [];

        // Filter by K8s resource labels
        const matchesLabels =
          !filters.label || filterLabelsArray.every((label) => resourceLabels.includes(label));

        return (
          matchesName && matchesLabels && (matchesAdditionalFilters?.(resource, filters) ?? true)
        );
      }) ?? [],
    [data, filters, isExactSearch, getObjectMetadata, matchesAdditionalFilters],
  );

  return { filters, onSetFilters, clearAllFilters, filteredData };
};
