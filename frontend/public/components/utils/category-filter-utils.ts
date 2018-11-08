/* eslint-disable no-undef */
import * as _ from 'lodash-es';
import {history} from './router';

const CATEGORY_URL_PARAM = 'category';
const KEYWORD_URL_PARAM = 'keyword';

const filterSubcategories = (category: any, item: any) => {
  if (!_.size(category.subcategories)) {
    if (!category.values) {
      return [];
    }

    let values = _.get(item, category.field);
    if (!Array.isArray(values)) {
      values = [values];
    }

    if (!_.isEmpty(_.intersection(category.values, values))) {
      return [category];
    }

    return [];
  }
  const matchedSubcategories = [];

  _.forEach(category.subcategories, subCat => {
    let values = _.get(item, category.field);
    if (!Array.isArray(values)) {
      values = [values];
    }
    if (!_.isEmpty(_.intersection(subCat.values, values))) {
      matchedSubcategories.push(subCat);
      matchedSubcategories.push(...filterSubcategories(subCat, item));
    }
  });

  return matchedSubcategories;
};

// categorize item under sub and main categories
const addItem = (item: any, category: any, subcategory: any = null) => {
  // Add the item to the category
  if (!category.items) {
    category.items = [item];
  } else if (!category.items.includes(item)) {
    category.items = category.items.concat(item);
  }

  // Add the item to the subcategory
  if (subcategory) {
    if (!subcategory.items) {
      subcategory.items = [item];
    } else if (!subcategory.items.includes(item)) {
      subcategory.items = subcategory.items.concat(item);
    }
  }
};

const sortItems: any = items => _.sortBy(items, 'tileName');
const isCategoryEmpty: any = ({ items }) => _.isEmpty(items);

const pruneCategoriesWithNoItems = (categories: any[]) => {
  _.remove(categories, isCategoryEmpty);
  _.each(categories, category =>
    _.remove(category.subcategories, isCategoryEmpty)
  );
};

const processSubCategories = (category: any) => {
  _.each(category.subcategories, subcategory => {
    if (subcategory.items) {
      subcategory.numItems = _.size(subcategory.items);
      subcategory.items = sortItems(subcategory.items);
      processSubCategories(subcategory);
    }
    if (_.size(category.subcategories)) {
      _.each(category.items, item => {
        const included: any = _.find(category.subcategories, subcat => _.includes(subcat.items, item));
        if (!included) {
          let otherCategory: any = _.find(category.subcategories, {id: 'other'});
          if (!otherCategory) {
            otherCategory = {id: 'other', label: 'Other', items: []};
            category.subcategories.push(otherCategory);
          }
          otherCategory.items.push(item);
        }
      });
    }
  });
};

// calculate numItems per Category and subcategories, sort items
const processCategories = (categories: any[]) => {
  _.each(categories, (category: any) => {
    if (category.items) {
      category.numItems = _.size(category.items);
      category.items = sortItems(category.items);
      processSubCategories(category);
    }
  });
};

const categorize = (items: any[], categories: any[]) => {
  let otherCategory: any = _.find(categories, { id: 'other' });
  if (!otherCategory) {
    otherCategory = {id: 'other', label: 'Other'};
    categories.push(otherCategory);
  }

  // Categorize each item
  _.each(items, (item: any) => {
    let itemCategorized = false;

    _.each(categories, (category: any) => {
      const matchedSubcategories = filterSubcategories(category, item);
      _.each(matchedSubcategories, (subcategory: any) => {
        addItem(item, category, subcategory); // add to subcategory & main category
        itemCategorized = true;
      });
    });
    if (!itemCategorized) {
      addItem(item, otherCategory); // add to Other category
    }
  });

  let allCategory: any = _.find(categories, { id: 'all' });
  if (!allCategory) {
    allCategory = {id: 'all', label: 'All Categories'};
    categories.unshift(allCategory);
  }

  allCategory.numItems = _.size(items);
  allCategory.items = items;
};

/**
 * Creates an items array under each category and subcategory.  If no match, categorizes item
 * under 'Other' main category.
 */
const categorizeItems = (items: any[], initCategories: any[]) => {
  const categories = _.cloneDeep(initCategories);

  categorize(items, categories);
  pruneCategoriesWithNoItems(categories);
  processCategories(categories);

  return categories;
};

const clearItemsFromCategories = (categories: any[]) => {
  _.each(categories, (category: any) => {
    category.numItems = 0;
    category.items = [];
    clearItemsFromCategories(category.subcategories);
  });
};

const recategorizeItems = (items: any[], categories: any[]) => {
  const newCategories = _.cloneDeep(categories);
  clearItemsFromCategories(newCategories);

  categorize(items, newCategories);
  processCategories(newCategories);

  return newCategories;
};

const isActiveTab = (activeId: any, category: any) => {
  if (_.size(category.subcategories)) {
    return !!_.find(category.subcategories, {id: activeId});
  }
  return false;
};

const hasActiveDescendant = (activeId: any, category: any) => {
  if (_.size(category.subcategories)) {
    return !!_.find(category.subcategories, (subcategory) => {
      return (subcategory.id === activeId || hasActiveDescendant(activeId, subcategory));
    });
  }
  return false;
};


const findActiveSubCategory = (activeId: any, category: any) => {
  let activeCategory = null;
  _.forEach(category.subcategories, subcategory => {
    if (subcategory.id === activeId) {
      activeCategory = subcategory;
    } else {
      const activeSubCategory = findActiveSubCategory(activeId, subcategory);
      if (activeSubCategory) {
        activeCategory = activeSubCategory;
      }
    }
  });

  return activeCategory;
};

const findActiveCategory = (activeId: any, categories: any[]) => {
  let activeCategory = null;
  _.forEach(categories, category => {
    if (category.id === activeId) {
      activeCategory = category;
    } else {
      const activeSubCategory = findActiveSubCategory(activeId, category);
      if (activeSubCategory) {
        activeCategory = activeSubCategory;
      }
    }
  });

  return activeCategory;
};

const getAvailableFilters = (defaultFilters: any, items: any[], filterGroups:any[]) => {
  const filters = _.cloneDeep(defaultFilters);

  _.each(filterGroups, field => {
    _.each(items, item => {
      const value = item[field];
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

const getActiveFilters = (keywordFilter, groupFilters, availableFilters) => {
  const activeFilters = _.cloneDeep(availableFilters);

  activeFilters.keyword.value = keywordFilter || '';
  activeFilters.keyword.active = !!keywordFilter;

  _.each(Object.keys(groupFilters), filterType => {
    _.each(groupFilters[filterType], filterValue => {
      _.set(activeFilters, [filterType, filterValue, 'active'], true);
    });
  });

  return activeFilters;
};

const updateActiveFilters = (activeFilters, filterType, id, value) => {
  const updatedFilters = _.cloneDeep(activeFilters);

  if (filterType === 'keyword') {
    _.set(updatedFilters, 'keyword.value', value);
    _.set(updatedFilters, 'keyword.active', !!value);
  } else {
    _.set(updatedFilters, [filterType, id, 'active'], value);
  }

  return updatedFilters;
};

const clearActiveFilters = (activeFilters, filterGroups) => {
  const clearedFilters = _.cloneDeep(activeFilters);

  // Clear the keyword filter
  _.set(clearedFilters, 'keyword.value', '');
  _.set(clearedFilters, 'keyword.active', false);

  // Clear the group filters
  _.each(filterGroups, field => {
    _.each(_.keys(clearedFilters[field]), key => _.set(clearedFilters, [field, key, 'active'], false));
  });

  return clearedFilters;
};

const setURLParams = params => {
  const location: any = window.location;
  const url = new URL(location);
  const searchParams = `?${params.toString()}${url.hash}`;

  history.replace(`${url.pathname}${searchParams}`);
};

const updateURLParams = (filterName, value) => {
  const params = new URLSearchParams(window.location.search);

  if (value) {
    params.set(filterName, Array.isArray(value) ? JSON.stringify(value) : value);
  } else {
    params.delete(filterName);
  }
  setURLParams(params);
};

const clearFilterURLParams = activeTabId => {
  const params = new URLSearchParams(window.location.search);

  if (activeTabId) {
    params.set(CATEGORY_URL_PARAM, activeTabId);
  }

  setURLParams(params);
};

const getActiveValuesFromURL = (availableFilters, filterGroups) => {
  const searchParams = new URLSearchParams(window.location.search);
  const categoryParam = searchParams.get(CATEGORY_URL_PARAM);
  let keywordFilter = searchParams.get(KEYWORD_URL_PARAM);

  const activeTabId = categoryParam || 'all';

  const groupFilters = {};

  _.forEach(filterGroups, filterGroup => {
    const groupFilterParam = searchParams.get(filterGroup);
    if (groupFilterParam) {
      _.set(groupFilters, [filterGroup], JSON.parse(groupFilterParam));
    }
  });

  let activeFilters = getActiveFilters(keywordFilter, groupFilters, availableFilters);

  return {activeTabId, activeFilters};
};

const getFilterSearchParam = groupFilter => {
  let activeValues = [];
  _.each(Object.keys(groupFilter), typeKey => {
    if (groupFilter[typeKey].active) {
      activeValues.push(typeKey);
    }
  });

  if (_.size(activeValues)) {
    return JSON.stringify(activeValues);
  }

  return '';
};

const getFilterGroupCounts = (items, filterGroups, activeTabId, filters, categories) => {
  const categoriesForCounts = recategorizeItems(items, categories);

  const activeCategory = findActiveCategory(activeTabId, categoriesForCounts);
  const activeItems = activeCategory ? activeCategory.items : 0;

  const newFilterCounts = {};

  _.forEach(filterGroups, filterGroup => {
    const count = _.countBy(activeItems, filterGroup);
    _.each(Object.keys(count), valueKey => {
      _.set(newFilterCounts, [filterGroup, valueKey], (count[valueKey] || 0));
    });
  });

  return newFilterCounts;
};

export const CategoryFilterUtils = {
  CATEGORY_URL_PARAM: CATEGORY_URL_PARAM,
  KEYWORD_URL_PARAM: KEYWORD_URL_PARAM,
  categorizeItems: categorizeItems,
  recategorizeItems: recategorizeItems,
  isActiveTab: isActiveTab,
  hasActiveDescendant: hasActiveDescendant,
  findActiveCategory: findActiveCategory,
  getAvailableFilters: getAvailableFilters,
  updateActiveFilters: updateActiveFilters,
  clearFilterURLParams: clearFilterURLParams,
  clearActiveFilters: clearActiveFilters,
  updateURLParams: updateURLParams,
  getActiveValuesFromURL: getActiveValuesFromURL,
  getFilterSearchParam: getFilterSearchParam,
  getFilterGroupCounts: getFilterGroupCounts,
};
