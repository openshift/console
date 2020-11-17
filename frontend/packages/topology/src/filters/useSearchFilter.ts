import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { toLower } from 'lodash';
import { useQueryParams } from '@console/shared/src';

const fuzzyCaseInsensitive = (a: string, b: string): boolean => fuzzy(toLower(a), toLower(b));

const useSearchFilter = (text: string): [boolean, string] => {
  const queryParams = useQueryParams();
  const searchQuery = queryParams.get('searchQuery');
  const filtered = React.useMemo(() => fuzzyCaseInsensitive(searchQuery, text), [
    searchQuery,
    text,
  ]);
  return [filtered && !!searchQuery, searchQuery];
};

export { useSearchFilter };
