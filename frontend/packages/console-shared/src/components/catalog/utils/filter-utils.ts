import * as _ from 'lodash';
import type { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { sortCatalogItems } from './catalog-utils';
import type { CatalogFilter, CatalogFilterCounts, CatalogFilters } from './types';
import { CatalogSortOrder } from './types';

const filterByGroup = (
  items: CatalogItem[],
  filters: CatalogFilters,
): Record<string, CatalogItem[]> =>
  // Filter items by each filter group
  _.reduce(
    filters,
    (filtered, group, key) => {
      // Only apply active filters
      const activeFilters = _.filter(group, 'active');
      if (activeFilters.length) {
        const values = _.reduce(
          activeFilters,
          (filterValues, filter) => {
            filterValues.push(filter.value);
            return filterValues;
          },
          [],
        );

        filtered[key] = _.filter(items, (item) => {
          const filterValue = item[key] || item.attributes?.[key];
          if (Array.isArray(filterValue)) {
            return filterValue.some((f) => values.includes(f));
          }
          return values.includes(filterValue);
        });
      }

      return filtered;
    },
    {},
  );
export const filterByAttributes = (
  items: CatalogItem[],
  filters: CatalogFilters,
): CatalogItem[] => {
  if (_.isEmpty(filters)) {
    return items;
  }

  // Apply each filter property individually. Example:
  //  filteredByGroup = {
  //    provider: [/*array of items filtered by provider*/],
  //    healthIndex: [/*array of items filtered by healthIndex*/],
  //  };
  const filteredByGroup = filterByGroup(items, filters);

  // Intersection of individually applied filters is all filters
  // In the case no filters are active, returns items filteredByKeyword
  return [..._.values(filteredByGroup), items].reduce((a, b) => a.filter((c) => b.includes(c)));
};

export const filterBySearchKeyword = (
  items: CatalogItem[],
  searchKeyword: string,
  sortOrder: CatalogSortOrder = CatalogSortOrder.RELEVANCE,
): CatalogItem[] => sortCatalogItems(items, sortOrder, searchKeyword);

export const filterByCategory = (
  items: CatalogItem[],
  categoryId: string,
  categorizedIds: Record<string, string[]>,
): CatalogItem[] =>
  categoryId !== 'all'
    ? items.filter((item) => categorizedIds[categoryId]?.includes(item.uid))
    : items;

export const determineAvailableFilters = (
  initialFilters: CatalogFilters,
  items: CatalogItem[],
  filterGroups: string[],
): CatalogFilters => {
  const filters = _.cloneDeep(initialFilters);
  _.each(filterGroups, (field) => {
    _.each(items, (item) => {
      const value = item[field] || item.attributes?.[field];
      if (value) {
        if (Array.isArray(value)) {
          _.each(value, (v) => {
            _.set(filters, [field, v], {
              label: v,
              value: v,
              active: false,
            });
          });
        } else {
          _.set(filters, [field, value], {
            label: value,
            value,
            active: false,
          });
        }
      }
    });
  });

  return filters;
};

export const getActiveFilters = (attributeFilters, initialFilters): CatalogFilters =>
  Object.entries(attributeFilters ?? {}).reduce<CatalogFilters>(
    (acc, [filterType, filterValues]) => {
      if (!acc[filterType]) return acc;
      return {
        ...acc,
        [filterType]: Object.fromEntries(
          Object.entries(acc[filterType]).map(([key, filter]) => [
            key,
            { ...filter, active: Array.isArray(filterValues) && filterValues.includes(key) },
          ]),
        ),
      };
    },
    initialFilters,
  );

export const getFilterGroupCounts = (
  items: CatalogItem[],
  activeFilters: CatalogFilters,
  filterGroups: string[],
): CatalogFilterCounts => {
  const newFilterCounts = {};

  if (_.isEmpty(activeFilters)) {
    return newFilterCounts;
  }

  _.each(filterGroups, (filterGroup) => {
    _.each(_.keys(activeFilters[filterGroup]), (key) => {
      const filterValues = [activeFilters[filterGroup]?.[key]?.value];

      const matchedItems = _.filter(items, (item) => {
        const filterValue = item[filterGroup] || item.attributes?.[filterGroup];
        if (Array.isArray(filterValue)) {
          return filterValue.some((f) => filterValues.includes(f));
        }

        return filterValues.includes(filterValue);
      });

      _.set(newFilterCounts, [filterGroup, key], _.size(matchedItems));
    });
  });

  return newFilterCounts;
};

export const getFilterSearchParam = (groupFilter: CatalogFilter): string => {
  const activeValues = _.reduce(
    _.keys(groupFilter),
    (result, typeKey) => (groupFilter[typeKey].active ? result.concat(typeKey) : result),
    [],
  );

  return _.isEmpty(activeValues) ? '' : JSON.stringify(activeValues);
};
