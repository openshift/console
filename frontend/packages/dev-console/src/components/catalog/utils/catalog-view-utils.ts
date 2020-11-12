import * as _ from 'lodash';
import { history } from '@console/internal/components/utils';
import { FilterTypes, getActiveFilters } from './filter-utils';

export const setURLParams = (params) => {
  const url = new URL(window.location.href);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

export const updateURLParams = (paramName, value) => {
  const params = new URLSearchParams(window.location.search);

  if (value) {
    params.set(paramName, Array.isArray(value) ? JSON.stringify(value) : value);
  } else {
    params.delete(paramName);
  }
  setURLParams(params);
};

export const clearFilterURLParams = (selectedCategory) => {
  const params = new URLSearchParams();

  if (selectedCategory) {
    params.set(FilterTypes.category, selectedCategory);
  }

  setURLParams(params);
};

export const getActiveValuesFromURL = (
  availableFilters,
  filterGroups,
  groupByTypes,
  filterStoreKey,
  filterRetentionPreference,
) => {
  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get(FilterTypes.category);
  const keywordFilter = searchParams.get(FilterTypes.keyword);
  const selectedCategory = categoryParam || 'all';
  let groupBy = '';
  if (groupByTypes) {
    groupBy = searchParams.get('groupBy') || groupByTypes.None;
  }
  const groupFilters = {};

  _.each(filterGroups, (filterGroup) => {
    const groupFilterParam = searchParams.get(filterGroup);
    if (!groupFilterParam) {
      return;
    }

    try {
      _.set(groupFilters, filterGroup, JSON.parse(groupFilterParam));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('could not update filters from url params: could not parse search params', e);
    }
  });

  const activeFilters = getActiveFilters(
    keywordFilter,
    groupFilters,
    availableFilters,
    categoryParam,
    filterStoreKey,
    filterRetentionPreference,
  );

  return { selectedCategory, activeFilters, groupBy };
};
