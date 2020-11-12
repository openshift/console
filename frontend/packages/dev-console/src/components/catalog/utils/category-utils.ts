import * as _ from 'lodash';

export const filterSubcategories = (category, item) => {
  if (!category.subcategories) {
    if (!category.values) {
      return [];
    }

    let values = _.get(item, category.field);
    if (!Array.isArray(values)) {
      values = [values];
    }

    const intersection = [category.values, values].reduce((a, b) => a.filter((c) => b.includes(c)));
    if (!_.isEmpty(intersection)) {
      return [category];
    }

    return [];
  }

  const matchedSubcategories = [];
  _.forOwn(category.subcategories, (subCategory) => {
    let values = _.get(item, category.field);

    if (!Array.isArray(values)) {
      values = [values];
    }

    const valuesIntersection = [subCategory.values, values].reduce((a, b) =>
      a.filter((c) => b.includes(c)),
    );
    if (!_.isEmpty(valuesIntersection)) {
      matchedSubcategories.push(subCategory, ...filterSubcategories(subCategory, item));
    }
  });

  return matchedSubcategories;
};

// categorize item under sub and main categories
export const addItem = (item, category, subcategory = null) => {
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

export const isCategoryEmpty = ({ items }) => _.isEmpty(items);

export const pruneCategoriesWithNoItems = (categories) => {
  if (!categories) {
    return;
  }

  _.forOwn(categories, (category, key) => {
    if (isCategoryEmpty(category)) {
      delete categories[key];
    } else {
      pruneCategoriesWithNoItems(category.subcategories);
    }
  });
};

export const processSubCategories = (category, itemsSorter) => {
  _.forOwn(category.subcategories, (subcategory) => {
    if (subcategory.items) {
      subcategory.numItems = _.size(subcategory.items);
      subcategory.items = itemsSorter(subcategory.items);
      processSubCategories(subcategory, itemsSorter);
    }
    if (category.subcategories) {
      _.each(category.items, (item) => {
        const included = _.find(_.keys(category.subcategories), (subcat) =>
          _.includes(category.subcategories[subcat].items, item),
        );
        if (!included) {
          let otherCategory = _.get(category.subcategories, 'other');
          if (!otherCategory) {
            otherCategory = { id: `${category.id}-other`, label: 'Other', items: [] };
            category.subcategories.other = otherCategory;
          }
          otherCategory.items.push(item);
        }
      });
    }
  });
};

// calculate numItems per Category and subcategories, sort items
export const processCategories = (categories, itemsSorter) => {
  _.forOwn(categories, (category) => {
    if (category.items) {
      category.numItems = _.size(category.items);
      category.items = itemsSorter(category.items);
      processSubCategories(category, itemsSorter);
    }
  });
};

export const categorize = (items, categories) => {
  // Categorize each item
  _.each(items, (item) => {
    let itemCategorized = false;

    _.each(categories, (category) => {
      const matchedSubcategories = filterSubcategories(category, item);
      _.each(matchedSubcategories, (subcategory) => {
        addItem(item, category, subcategory); // add to subcategory & main category
        itemCategorized = true;
      });
    });
    if (!itemCategorized) {
      addItem(item, categories.other); // add to Other category
    }
  });

  categories.all.numItems = _.size(items);
  categories.all.items = items;
};

/**
 * Creates an items array under each category and subcategory.  If no match, categorizes item
 * under 'Other' main category.
 * (exported for test purposes)
 */
export const categorizeItems = (items, itemsSorter, initCategories) => {
  const allCategory = { id: 'all', label: 'All Items' };
  const otherCategory = { id: 'other', label: 'Other' };

  const categories = {
    all: allCategory,
    ..._.cloneDeep(initCategories),
    other: otherCategory,
  };

  categorize(items, categories);
  pruneCategoriesWithNoItems(categories);
  processCategories(categories, itemsSorter);

  return categories;
};

export const clearItemsFromCategories = (categories) => {
  _.forOwn(categories, (category) => {
    category.numItems = 0;
    category.items = [];
    clearItemsFromCategories(category.subcategories);
  });
};

export const findActiveCategory = (activeId, categories) => {
  let activeCategory = null;
  _.forOwn(categories, (category) => {
    if (activeCategory) {
      return;
    }

    if (category.id === activeId) {
      activeCategory = category;
    } else {
      activeCategory = findActiveCategory(activeId, category.subcategories);
    }
  });
  return activeCategory;
};
