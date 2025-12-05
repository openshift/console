import * as React from 'react';
import { useDataViewFilters } from '@patternfly/react-data-view';
import { useSearchParams } from 'react-router-dom-v5-compat';
import { useExactSearch } from '@console/app/src/components/user-preferences/search/useExactSearch';
import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  exactMatch,
  fuzzyCaseInsensitive,
} from '@console/internal/components/factory/table-filters';
import { mapLabelsToStrings } from '@console/shared/src/utils/label-filter';
import { ResourceFilters, ResourceMetadata } from './types';

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

  const filteredData = React.useMemo(
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
