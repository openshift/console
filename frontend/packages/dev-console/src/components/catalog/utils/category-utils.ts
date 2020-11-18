import * as _ from 'lodash';
import { CatalogItem } from '@console/plugin-sdk';
import { CatalogCategories } from './types';

export const matchSubcategories = (category, item) => {
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
      matchedSubcategories.push(subCategory, ...matchSubcategories(subCategory, item));
    }
  });

  return matchedSubcategories;
};

// categorize item under sub and main categories
export const addItem = (categorizedItems, itemId, categoryId) => {
  // Add the item to the category
  if (!categorizedItems[categoryId]) {
    categorizedItems[categoryId] = [itemId];
  } else if (!categorizedItems[categoryId].includes(itemId)) {
    categorizedItems[categoryId].push(itemId);
  }
};

/**
 * Creates an items array under each category and subcategory.  If no match, categorizes item
 * under 'Other' main category.
 * (exported for test purposes)
 */
export const categorize = (
  items: CatalogItem[],
  categories: CatalogCategories,
): Record<string, string[]> => {
  const categorizedItems = {};

  // Categorize each item
  _.each(items, (item) => {
    let itemCategorized = false;

    addItem(categorizedItems, item.uid, categories.all.id); // add each item to all category

    _.each(categories, (category) => {
      const matchedSubcategories = matchSubcategories(category, item);
      _.each(matchedSubcategories, (subcategory) => {
        addItem(categorizedItems, item.uid, category.id);
        addItem(categorizedItems, item.uid, subcategory.id);
        itemCategorized = true;
      });
    });

    if (!itemCategorized) {
      addItem(categorizedItems, item.uid, categories.other.id); // add to Other category
    }
  });

  return categorizedItems;
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
