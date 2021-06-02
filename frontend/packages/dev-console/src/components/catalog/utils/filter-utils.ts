import * as _ from 'lodash';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { keywordCompare } from './catalog-utils';
import { CatalogFilter, CatalogFilterCounts, CatalogFilters } from './types';

export const filterByGroup = (
  items: CatalogItem[],
  filters: CatalogFilters,
): Record<string, CatalogItem[]> => {
  // Filter items by each filter group
  return _.reduce(
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
};

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
): CatalogItem[] => {
  return keywordCompare(searchKeyword, items);
};

export const filterByCategory = (
  items: CatalogItem[],
  categoryId: string,
  categorizedIds: Record<string, string[]>,
): CatalogItem[] => {
  return categoryId !== 'all'
    ? items.filter((item) => categorizedIds[categoryId]?.includes(item.uid))
    : items;
};

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
        _.set(filters, [field, value], {
          label: value,
          value,
          active: false,
        });
      }
    });
  });

  return filters;
};

export const getActiveFilters = (attributeFilters, activeFilters): CatalogFilters => {
  _.forOwn(attributeFilters, (filterValues, filterType) => {
    // removing default and localstore filters if Filters are present over URL
    _.each(_.keys(activeFilters[filterType]), (key) =>
      _.set(activeFilters, [filterType, key, 'active'], false),
    );
    _.each(filterValues, (filterValue) => {
      _.set(activeFilters, [filterType, filterValue, 'active'], true);
    });
  });

  return activeFilters;
};

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
      const filterValues = [activeFilters[filterGroup]?.[key]?.['value']];

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
    (result, typeKey) => {
      return groupFilter[typeKey].active ? result.concat(typeKey) : result;
    },
    [],
  );

  return _.isEmpty(activeValues) ? '' : JSON.stringify(activeValues);
};
