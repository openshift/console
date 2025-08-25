import * as React from 'react';
import * as _ from 'lodash';
import { CatalogCategory } from '@console/shared/src/components/catalog/utils/types';
import useCatalogItems from './useCatalogItems';

export const useExtensionCatalogCategories = (): [CatalogCategory[], boolean, Error] => {
  const [catalogItems, loading, error] = useCatalogItems();
  const categories = React.useMemo(() => {
    if (loading || error || catalogItems.length === 0) {
      return [];
    }
    return _.uniq(catalogItems.flatMap(({ tags }) => tags)).map((c) => ({
      id: c,
      label: c,
      tags: [c],
    }));
  }, [catalogItems, error, loading]);

  return [categories, loading, error];
};
