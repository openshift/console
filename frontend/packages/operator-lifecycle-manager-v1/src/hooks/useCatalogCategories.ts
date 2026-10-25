import { useMemo } from 'react';
import * as _ from 'lodash';
import type { CatalogCategory } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import useCatalogItems from './useCatalogItems';

type UseCatalogCategories = () => [CatalogCategory[], boolean, string];
const useCatalogCategories: UseCatalogCategories = () => {
  const [items, loaded, error] = useCatalogItems();
  const categories = useMemo(() => {
    if (!loaded || error) {
      return [];
    }
    return _.uniq(
      items.flatMap<string>(({ data }) => (data.categories ?? []).map((cat) => cat.trim())),
    )
      .filter(Boolean)
      .sort()
      .map((label) => {
        const id = label.toLowerCase();
        return {
          id,
          label,
          tags: [id, label],
        };
      });
  }, [error, items, loaded]);

  return [categories, loaded, error];
};

export default useCatalogCategories;
