import { useMemo } from 'react';
import type { CatalogCategory } from '@console/dynamic-plugin-sdk/src';
import { defaultCatalogCategories } from '@console/shared/src/utils/default-categories';

export const useDeveloperCatalogCategories = (): CatalogCategory[] =>
  useMemo<CatalogCategory[]>(() => {
    try {
      const categoriesString = window.SERVER_FLAGS.developerCatalogCategories;
      if (!categoriesString) {
        return defaultCatalogCategories;
      }

      const categoriesArray: CatalogCategory[] = JSON.parse(categoriesString);

      if (!Array.isArray(categoriesArray)) {
        console.error(
          `Unexpected server flag "developerCatalogCategories" format. Expected array, got ${typeof categoriesArray}:`,
          categoriesArray,
        );
        return defaultCatalogCategories;
      }

      return categoriesArray;
    } catch (error) {
      console.error('Could not parse server flag "developerCatalogCategories":', error);
      return defaultCatalogCategories;
    }
  }, []);
