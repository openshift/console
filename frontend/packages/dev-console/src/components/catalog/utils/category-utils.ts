import * as _ from 'lodash';
import { CatalogItem } from '@console/plugin-sdk';
import { CatalogCategories, CatalogCategory, CatalogSubcategory } from './types';

export const matchSubcategories = (
  category: CatalogCategory,
  item: CatalogItem,
): (CatalogCategory | CatalogSubcategory)[] => {
  if (!category.subcategories) {
    if (!category.values) {
      return [];
    }

    let values = item[category.field];
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
    let values = item[category.field];

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

// categorize item id under sub and main categories
export const addItem = (
  categorizedIds: Record<string, string[]>,
  itemId: string,
  categoryId: string,
): void => {
  // Add the item to the category
  if (!categorizedIds[categoryId]) {
    categorizedIds[categoryId] = [itemId];
  } else if (!categorizedIds[categoryId].includes(itemId)) {
    categorizedIds[categoryId].push(itemId);
  }
};

/**
 * Creates an array of item Ids for each matching category and subcategory.
 * If no match, categorizes item id under 'Other' main category.
 */
export const categorize = (
  items: CatalogItem[],
  categories: CatalogCategories,
): Record<string, string[]> => {
  const categorizedIds = {};

  // Categorize each item
  _.each(items, (item) => {
    let itemCategorized = false;

    addItem(categorizedIds, item.uid, categories.all.id); // add each item to all category

    _.each(categories, (category) => {
      const matchedSubcategories = matchSubcategories(category, item);
      _.each(matchedSubcategories, (subcategory) => {
        addItem(categorizedIds, item.uid, category.id);
        addItem(categorizedIds, item.uid, subcategory.id);
        itemCategorized = true;
      });
    });

    if (!itemCategorized) {
      addItem(categorizedIds, item.uid, categories.other.id); // add to Other category
    }
  });

  return categorizedIds;
};

export const findActiveCategory = (
  activeId: string,
  categories: CatalogCategories,
): CatalogCategory => {
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

export const hasActiveDescendant = (activeId: string, category: CatalogCategory): boolean => {
  if (_.has(category?.subcategories, activeId)) {
    return true;
  }

  return _.some(category?.subcategories, (subcategory) =>
    hasActiveDescendant(activeId, subcategory),
  );
};

export const isActiveTab = (activeId: string, category: CatalogCategory): boolean => {
  return _.has(category?.subcategories, activeId);
};
