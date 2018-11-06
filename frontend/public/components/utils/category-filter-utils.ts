/* eslint-disable no-undef */
import * as _ from 'lodash-es';

export class CategoryFilterUtils {
  static CATEGORY_URL_PARAM = 'category';
  static KEYWORD_URL_PARAM = 'keyword';
  static FILTER_SEPARATOR = ',|,';

  static filterSubcategories = (category: any, item: any) => {
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
        matchedSubcategories.push(...CategoryFilterUtils.filterSubcategories(subCat, item));
      }
    });

    return matchedSubcategories;
  };

  // categorize item under sub and main categories
  static addItem = (item: any, category: any, subcategory: any = null) => {

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

  static sortItems: any = items => _.sortBy(items, 'tileName');
  static isCategoryEmpty: any = ({ items }) => _.isEmpty(items);

  static pruneCategoriesWithNoItems = (categories: any[]) => {
    _.remove(categories, CategoryFilterUtils.isCategoryEmpty);
    _.each(categories, category =>
      _.remove(category.subcategories, CategoryFilterUtils.isCategoryEmpty)
    );
  };

  static processSubCategories = (category: any) => {
    _.each(category.subcategories, subcategory => {
      if (subcategory.items) {
        subcategory.numItems = _.size(subcategory.items);
        subcategory.items = CategoryFilterUtils.sortItems(subcategory.items);
        CategoryFilterUtils.processSubCategories(subcategory);
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
  static processCategories = (categories: any[]) => {
    _.each(categories, (category: any) => {
      if (category.items) {
        category.numItems = _.size(category.items);
        category.items = CategoryFilterUtils.sortItems(category.items);
        CategoryFilterUtils.processSubCategories(category);
      }
    });
  };

  static categorize = (items: any[], categories: any[]) => {
    let otherCategory: any = _.find(categories, { id: 'other' });
    if (!otherCategory) {
      otherCategory = {id: 'other', label: 'Other'};
      categories.push(otherCategory);
    }

    // Categorize each item
    _.each(items, (item: any) => {
      let itemCategorized = false;

      _.each(categories, (category: any) => {
        const matchedSubcategories = CategoryFilterUtils.filterSubcategories(category, item);
        _.each(matchedSubcategories, (subcategory: any) => {
          CategoryFilterUtils.addItem(item, category, subcategory); // add to subcategory & main category
          itemCategorized = true;
        });
      });
      if (!itemCategorized) {
        CategoryFilterUtils.addItem(item, otherCategory); // add to Other category
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
  static categorizeItems = (items: any[], initCategories: any[]) => {
    const categories = _.cloneDeep(initCategories);

    CategoryFilterUtils.categorize(items, categories);
    CategoryFilterUtils.pruneCategoriesWithNoItems(categories);
    CategoryFilterUtils.processCategories(categories);

    return categories;
  };

  static clearItemsFromCategories = (categories: any[]) => {
    _.each(categories, (category: any) => {
      category.numItems = 0;
      category.items = [];
      CategoryFilterUtils.clearItemsFromCategories(category.subcategories);
    });
  };

  static recategorizeItems = (items: any[], categories: any[]) => {
    const newCategories = _.cloneDeep(categories);
    CategoryFilterUtils.clearItemsFromCategories(newCategories);

    CategoryFilterUtils.categorize(items, newCategories);
    CategoryFilterUtils.processCategories(newCategories);

    return newCategories;
  };

  static isActiveTab = (activeId: any, category: any) => {
    if (_.size(category.subcategories)) {
      return !!_.find(category.subcategories, {id: activeId});
    }
    return false;
  };

  static hasActiveDescendant = (activeId: any, category: any) => {

    if (_.size(category.subcategories)) {
      return !!_.find(category.subcategories, (subcategory) => {
        return (subcategory.id === activeId || CategoryFilterUtils.hasActiveDescendant(activeId, subcategory));
      });
    }
    return false;
  };


  static findActiveSubCategory = (activeId: any, category: any) => {
    let activeCategory = null;
    _.forEach(category.subcategories, subcategory => {
      if (subcategory.id === activeId) {
        activeCategory = subcategory;
      } else {
        const activeSubCategory = CategoryFilterUtils.findActiveSubCategory(activeId, subcategory);
        if (activeSubCategory) {
          activeCategory = activeSubCategory;
        }
      }
    });

    return activeCategory;
  };

  static findActiveCategory = (activeId: any, categories: any[]) => {
    let activeCategory = null;
    _.forEach(categories, category => {
      if (category.id === activeId) {
        activeCategory = category;
      } else {
        const activeSubCategory = CategoryFilterUtils.findActiveSubCategory(activeId, category);
        if (activeSubCategory) {
          activeCategory = activeSubCategory;
        }
      }
    });

    return activeCategory;
  };

  static getAvailableFilters = (defaultFilters: any, items: any[], filterGroups:any[]) => {
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

  static getActiveFilters = (keywordFilter, groupFilters, availableFilters) => {
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

  static getActiveValuesFromURL = (availableFilters, filterGroups, searchURL) => {
    const searchParams = new URLSearchParams(searchURL);
    const categoryParam = searchParams.get(CategoryFilterUtils.CATEGORY_URL_PARAM);
    let keywordFilter = searchParams.get(CategoryFilterUtils.KEYWORD_URL_PARAM);

    const activeTabId = categoryParam || 'all';

    const groupFilters = {};

    _.forEach(filterGroups, filterGroup => {
      const groupFilterParam = searchParams.get(filterGroup);
      if (groupFilterParam) {
        _.set(groupFilters, [filterGroup], groupFilterParam.split(CategoryFilterUtils.FILTER_SEPARATOR));
      }
    });

    let activeFilters = CategoryFilterUtils.getActiveFilters(keywordFilter, groupFilters, availableFilters);

    return {activeTabId, activeFilters};
  };

  static getFilterSearchParam(groupFilter) {
    let searchParam = '';
    _.each(Object.keys(groupFilter), typeKey => {
      searchParam += groupFilter[typeKey].active ? (searchParam ? `${CategoryFilterUtils.FILTER_SEPARATOR}${typeKey}` : typeKey) : '';
    });

    return searchParam;
  }

  static getFilterGroupCounts(items, filterGroups, activeTabId, filters, categories) {
    const categoriesForCounts = CategoryFilterUtils.recategorizeItems(items, categories);

    const activeCategory = CategoryFilterUtils.findActiveCategory(activeTabId, categoriesForCounts);
    const activeItems = activeCategory ? activeCategory.items : 0;

    const newFilterCounts = {};

    _.forEach(filterGroups, filterGroup => {
      const count = _.countBy(activeItems, filterGroup);
      _.each(Object.keys(count), valueKey => {
        _.set(newFilterCounts, [filterGroup, valueKey], (count[valueKey] || 0));
      });
    });

    return newFilterCounts;
  }
}
