import * as React from 'react';
import { CatalogCategory } from '@console/dynamic-plugin-sdk/src';
import { usePoll } from '@console/internal/components/utils';
import { ExtensionCatalogDatabaseContext } from '../contexts/ExtensionCatalogDatabaseContext';
import { getUniqueIndexKeys, openDatabase } from '../database/indexeddb';

export const useExtensionCatalogCategories = (): CatalogCategory[] => {
  const { done: initDone, error: initError } = React.useContext(ExtensionCatalogDatabaseContext);
  const [categories, setCategories] = React.useState([]);

  const tick = React.useCallback(() => {
    if (initDone && !initError) {
      openDatabase('olm')
        .then((database) => getUniqueIndexKeys(database, 'extension-catalog', 'categories'))
        .then((c) => {
          setCategories(c);
        })
        .catch(() => {
          setCategories([]);
        });
    }
  }, [initDone, initError]);

  // Poll IndexedDB (IDB) every 10 seconds
  usePoll(tick, 10000);
  const catalogCategories = React.useMemo<CatalogCategory[]>(
    () => categories.map((c) => ({ id: c, label: c, tags: [c] })),
    [categories],
  );
  return catalogCategories;
};

export default useExtensionCatalogCategories;
