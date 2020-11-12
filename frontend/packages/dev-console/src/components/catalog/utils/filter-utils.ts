import * as _ from 'lodash';
import {
  categorize,
  clearItemsFromCategories,
  findActiveCategory,
  processCategories,
} from './category-utils';

export const FilterTypes = {
  category: 'category',
  keyword: 'keyword',
};

export const defaultFilters = {
  keyword: {
    value: '',
    active: false,
  },
};

export const filterByKeyword = (items, filters, compFunction) => {
  const { keyword } = filters;
  if (!keyword || !keyword.active) {
    return items;
  }

  const filterString = keyword.value.toLowerCase();
  return _.filter(items, (item) => compFunction(filterString, item));
};

export const filterByGroup = (items, filters) => {
  // Filter items by each filter group
  return _.reduce(
    filters,
    (filtered, group, key) => {
      if (key === FilterTypes.keyword) {
        return filtered;
      }
      // Only apply active filters
      const activeFilters = _.filter(group, 'active');
      if (activeFilters.length) {
        const values = _.reduce(
          activeFilters,
          (filterValues, filter) => {
            filterValues.push(filter.value, ..._.get(filter, 'synonyms', []));
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

export const filterItems = (items, filters, keywordCompare) => {
  if (_.isEmpty(filters)) {
    return items;
  }

  // Filter items by keyword first
  const filteredByKeyword = filterByKeyword(items, filters, keywordCompare);

  // Apply each filter property individually. Example:
  //  filteredByGroup = {
  //    provider: [/*array of items filtered by provider*/],
  //    healthIndex: [/*array of items filtered by healthIndex*/],
  //  };
  const filteredByGroup = filterByGroup(filteredByKeyword, filters);

  // Intersection of individually applied filters is all filters
  // In the case no filters are active, returns items filteredByKeyword
  return [..._.values(filteredByGroup), filteredByKeyword].reduce((a, b) =>
    a.filter((c) => b.includes(c)),
  );
};

export const recategorizeItems = (items, itemsSorter, filters, keywordCompare, categories) => {
  const filteredItems = filterItems(items, filters, keywordCompare);

  const newCategories = _.cloneDeep(categories);
  clearItemsFromCategories(newCategories);

  categorize(filteredItems, newCategories);
  processCategories(newCategories, itemsSorter);

  return newCategories;
};

export const determineAvailableFilters = (initialFilters, items, filterGroups) => {
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

export const getActiveFilters = (
  keywordFilter,
  groupFilters,
  activeFilters,
  categoryFilter = null,
  storeFilterKey = null,
  filterRetentionPreference = null,
) => {
  activeFilters.keyword.value = keywordFilter || '';
  activeFilters.keyword.active = !!keywordFilter;

  const userFilters = storeFilterKey ? localStorage.getItem(storeFilterKey) : null;
  if (userFilters) {
    try {
      const lastFilters = JSON.parse(userFilters);
      if (lastFilters) {
        if (filterRetentionPreference) {
          _.each(filterRetentionPreference, (filterGroup) => {
            if (!groupFilters || !groupFilters[filterGroup]) {
              if (lastFilters[filterGroup]) {
                activeFilters[filterGroup] = lastFilters[filterGroup];
              }
            }
          });
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed parsing user filter settings.');
    }
  }

  if (categoryFilter) {
    // removing default and localstore filters if category filters are present over URL
    _.each(_.keys(activeFilters.kind), (key) =>
      _.set(activeFilters, ['kind', key, 'active'], false),
    );
  }

  _.forOwn(groupFilters, (filterValues, filterType) => {
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

export const updateActiveFilters = (activeFilters, filterType, id, value) => {
  if (filterType === FilterTypes.keyword) {
    _.set(activeFilters, 'keyword.value', value);
    _.set(activeFilters, 'keyword.active', !!value);
  } else {
    _.set(activeFilters, [filterType, id, 'active'], value);
  }

  return activeFilters;
};

export const clearActiveFilters = (activeFilters, filterGroups) => {
  // Clear the keyword filter
  _.set(activeFilters, 'keyword.value', '');
  _.set(activeFilters, 'keyword.active', false);

  // Clear the group filters
  _.each(filterGroups, (field) => {
    _.each(_.keys(activeFilters[field]), (key) =>
      _.set(activeFilters, [field, key, 'active'], false),
    );
  });

  return activeFilters;
};

export const getFilterGroupCounts = (
  items,
  itemsSorter,
  filterGroups,
  selectedCategoryId,
  filters,
  categories,
  keywordCompare,
) => {
  // Filter only by keyword
  const filteredItems = filterByKeyword(items, filters, keywordCompare);

  const categoriesForCounts = recategorizeItems(
    filteredItems,
    itemsSorter,
    [],
    keywordCompare,
    categories,
  );

  const activeCategory = findActiveCategory(selectedCategoryId, categoriesForCounts);
  const activeItems = activeCategory ? activeCategory.items : [];
  const newFilterCounts = {};

  _.each(filterGroups, (filterGroup) => {
    _.each(_.keys(filters[filterGroup]), (key) => {
      const filterValues = [
        _.get(filters, [filterGroup, key, 'value']),
        ..._.get(filters, [filterGroup, key, 'synonyms'], []),
      ];

      const matchedItems = _.filter(activeItems, (item) => {
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

export const getFilterSearchParam = (groupFilter) => {
  const activeValues = _.reduce(
    _.keys(groupFilter),
    (result, typeKey) => {
      return groupFilter[typeKey].active ? result.concat(typeKey) : result;
    },
    [],
  );

  return _.isEmpty(activeValues) ? '' : JSON.stringify(activeValues);
};
