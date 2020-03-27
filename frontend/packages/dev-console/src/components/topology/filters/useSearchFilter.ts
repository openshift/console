import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { toLower } from 'lodash';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';
import { getTopologyFilters } from './filter-utils';

const fuzzyCaseInsensitive = (a: string, b: string): boolean => fuzzy(toLower(a), toLower(b));

const useSearchFilter = (text: string): [boolean, string] => {
  const searchQuery = useSelector((state: RootState) => getTopologyFilters(state).searchQuery);
  const filtered = React.useMemo(() => fuzzyCaseInsensitive(searchQuery, text), [
    searchQuery,
    text,
  ]);
  return [filtered && !!searchQuery, searchQuery];
};

export { useSearchFilter };
