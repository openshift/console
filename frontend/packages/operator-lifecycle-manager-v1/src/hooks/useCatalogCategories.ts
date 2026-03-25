import { useMemo } from 'react';
import * as _ from 'lodash';
import type { CatalogCategory } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import useCatalogItems from './useCatalogItems';

type UseCatalogCategories = () => [CatalogCategory[], boolean, string];
const useCatalogCategories: UseCatalogCategories = () => {
  const [items, loading, error] = useCatalogItems();
  const categories = useMemo(() => {
    if (loading || error) {
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
  }, [error, items, loading]);

  return [categories, loading, error];
};

export default useCatalogCategories;
