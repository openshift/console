import * as React from 'react';
import * as fuzzy from 'fuzzysearch';
import { toLower } from 'lodash';
import { useQueryParams } from '@console/shared/src';

const EMPTY_QUERY_PARAMS = [];

const fuzzyCaseInsensitive = (a: string, b: string): boolean => fuzzy(toLower(a), toLower(b));

const useSearchFilter = (
  name: string,
  labels: { [key: string]: string } = {},
): [boolean, string] => {
  const queryParams = useQueryParams();
  const searchQuery = queryParams.get('searchQuery');
  const labelsQuery = queryParams.get('labels')?.split(',') ?? EMPTY_QUERY_PARAMS;

  const labelsMatched = React.useMemo(() => {
    const labelsString = Object.entries(labels).map((label) => label.join('='));
    return labelsQuery.every((label) => labelsString.includes(label));
  }, [labels, labelsQuery]);

  const filtered = React.useMemo(() => fuzzyCaseInsensitive(searchQuery, name), [
    searchQuery,
    name,
  ]);

  return [(filtered && !!searchQuery) || (labelsMatched && labelsQuery.length > 0), searchQuery];
};

export { useSearchFilter };
