import { useMemo } from 'react';
import * as _ from 'lodash';
import type { ExtensionHook } from '@console/dynamic-plugin-sdk/src/api/common-types';
import type { CatalogCategory } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import { useCatalogItems } from './useCatalogItems';

export const useCatalogCategories: ExtensionHook<CatalogCategory[]> = () => {
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
