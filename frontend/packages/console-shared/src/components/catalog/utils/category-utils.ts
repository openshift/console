import * as _ from 'lodash';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions';
import { CatalogCategory, CatalogSubcategory } from './types';

export const NO_GROUPING = 'none';
export const ALL_CATEGORY = 'all';
export const OTHER_CATEGORY = 'other';

export const matchSubcategories = (
  category: CatalogCategory,
  item: CatalogItem,
): (CatalogCategory | CatalogSubcategory)[] => {
  if (!category.subcategories) {
    if (!category.tags) {
      return [];
    }

    const intersection = [category.tags, item.tags || []].reduce((a, b) =>
      a.filter((c) => b.includes(c)),
    );
    if (!_.isEmpty(intersection)) {
      return [category];
    }

    return [];
  }

  const matchedSubcategories: (CatalogCategory | CatalogSubcategory)[] = [];
  _.each(category.subcategories, (subCategory) => {
    const valuesIntersection = [subCategory.tags, item.tags || []].reduce((a, b) =>
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
  categories: CatalogCategory[],
): Record<string, string[]> => {
  const categorizedIds = {};

  // Categorize each item
  _.each(items, (item) => {
    let itemCategorized = false;

    addItem(categorizedIds, item.uid, ALL_CATEGORY); // add each item to all category

    _.each(categories, (category: CatalogCategory) => {
      const matchedSubcategories = matchSubcategories(category, item);
      _.each(matchedSubcategories, (subcategory) => {
        addItem(categorizedIds, item.uid, category.id);
        addItem(categorizedIds, item.uid, subcategory.id);
        itemCategorized = true;
      });
    });

    if (!itemCategorized) {
      addItem(categorizedIds, item.uid, OTHER_CATEGORY); // add to Other category
    }
  });

  return categorizedIds;
};

export const findActiveCategory = (
  activeId: string,
  categories: CatalogCategory[],
): CatalogCategory => {
  let activeCategory = null;
  _.each(categories, (category) => {
    if (activeCategory) {
      return;
    }

    if (category.id === activeId) {
      activeCategory = category;
    } else if (category.subcategories) {
      activeCategory = findActiveCategory(activeId, category.subcategories);
    }
  });
  return activeCategory;
};

export const hasActiveDescendant = (activeId: string, category: CatalogCategory): boolean => {
  if (_.has(category.subcategories, activeId)) {
    return true;
  }

  return _.some(category.subcategories, (subcategory) =>
    hasActiveDescendant(activeId, subcategory),
  );
};

export const isActiveTab = (activeId: string, category: CatalogCategory): boolean => {
  return _.has(category.subcategories, activeId);
};
