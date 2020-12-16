import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { toLower } from 'lodash';
import { getTopologySearchQuery } from './filter-utils';

const fuzzyCaseInsensitive = (a: string, b: string): boolean => fuzzy(toLower(a), toLower(b));

const useSearchFilter = (text: string): [boolean, string] => {
  const searchQuery = getTopologySearchQuery();
  const filtered = React.useMemo(() => fuzzyCaseInsensitive(searchQuery, text), [
    searchQuery,
    text,
  ]);
  return [filtered && !!searchQuery, searchQuery];
};

export { useSearchFilter };
