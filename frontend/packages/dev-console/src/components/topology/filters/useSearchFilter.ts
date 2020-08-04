import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { toLower } from 'lodash';
import { getTopologySearchQuery, getTopologySearchType, TopologySearchType } from './filter-utils';

const fuzzyCaseInsensitive = (a: string, b: string): boolean => fuzzy(toLower(a), toLower(b));

const useSearchFilter = (text: string, labels?: string[]): [boolean, string, string] => {
  const searchQuery = getTopologySearchQuery();
  const searchType = getTopologySearchType();
  const filtered = React.useMemo(() => {
    if (searchType === TopologySearchType.label) {
      if (!labels) {
        return false;
      }
      return labels.includes(searchQuery);
    }
    return fuzzyCaseInsensitive(searchQuery, text);
  }, [searchQuery, searchType, text, labels]);
  return [filtered && !!searchQuery, searchQuery, searchType];
};

export { useSearchFilter };
