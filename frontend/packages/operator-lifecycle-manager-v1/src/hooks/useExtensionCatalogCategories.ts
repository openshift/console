import * as React from 'react';
import { CatalogCategory } from '@console/shared/src/components/catalog/utils/types';
import { usePromiseHandler } from '@console/shared/src/hooks/promise-handler';

export const useExtensionCatalogCategories = (): [CatalogCategory[], boolean, string] => {
  const [categories] = React.useState<CatalogCategory[]>([]);
  const [, inProgress, errorMessage] = usePromiseHandler();
  return [categories, inProgress, errorMessage];
};
