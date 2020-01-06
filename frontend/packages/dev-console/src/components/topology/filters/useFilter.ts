import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { toLower } from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { TopologyFilters } from './filter-utils';

const useFilter = (filters: TopologyFilters, resource: K8sResourceKind) => {
  const [filtered, setFiltered] = React.useState(false);
  const fuzzyCaseInsensitive = (a: string, b: string): boolean => fuzzy(toLower(a), toLower(b));

  React.useEffect(() => {
    if (filters.searchQuery.trim().length) {
      setFiltered(fuzzyCaseInsensitive(filters.searchQuery, resource.metadata.name));
    }
  }, [filters.searchQuery, resource.metadata.name]);

  return filtered;
};

export default useFilter;
