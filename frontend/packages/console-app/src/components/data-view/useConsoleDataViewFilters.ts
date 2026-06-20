import { useMemo } from 'react';
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

const getOpenShiftDisplayName = (resource: K8sResourceCommon): string | undefined =>
  resource.metadata?.annotations?.['openshift.io/display-name'];

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

  const filteredData = useMemo(
    () =>
      data?.filter((resource) => {
        const { name: resourceName, labels } = getObjectMetadata(resource);
        const displayName = getOpenShiftDisplayName(resource as K8sResourceCommon);

        // Filter by K8s resource name or display name
        const matchFn = isExactSearch ? exactMatch : fuzzyCaseInsensitive;
        const matchesName =
          !filters.name ||
          matchFn(filters.name, resourceName) ||
          matchFn(filters.name, displayName);

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
