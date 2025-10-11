import { K8sResourceCommon } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { getLabelsAsString } from '@console/shared/src/utils/label-filter';
import { ResourceFilters } from './types';
import { useGeneralDataViewFilters } from './useGeneralDataViewFilters';

export const useResourceDataViewFilters = <
  TData extends K8sResourceCommon = K8sResourceCommon,
  TFilters extends ResourceFilters = ResourceFilters
>({
  data,
  initialFilters,
  matchesAdditionalFilters,
}: {
  data: TData[];
  initialFilters: TFilters;
  matchesAdditionalFilters?: (resource: TData, filters: TFilters) => boolean;
}) => {
  // Use the general data view filters hook with K8s-specific adapters
  return useGeneralDataViewFilters({
    data,
    initialFilters,
    matchesAdditionalFilters,
    getNameFromItem: (resource: TData) => resource.metadata.name,
    getLabelsAsString: (resource: TData) => getLabelsAsString(resource).join(','),
  });
};
