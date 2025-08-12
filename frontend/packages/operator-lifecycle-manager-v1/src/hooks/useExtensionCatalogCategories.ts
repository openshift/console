import * as React from 'react';
import { CatalogCategory } from '@console/dynamic-plugin-sdk/src';
import { usePoll } from '@console/internal/components/utils';
import { ExtensionCatalogDatabaseContext } from '../contexts/ExtensionCatalogDatabaseContext';
import { getUniqueIndexKeys, openDatabase } from '../database/indexeddb';

export const useExtensionCatalogCategories = (): [CatalogCategory[], boolean, Error] => {
  const { done: initDone, error: initError } = React.useContext(ExtensionCatalogDatabaseContext);
  const [categories, setCategories] = React.useState<IDBValidKey[]>([]);
  const [loading, setLoading] = React.useState(!initDone);
  const [error, setError] = React.useState<Error | null>(initError ?? null);

  React.useEffect(() => {
    if (!initDone || initError) {
      setLoading(!initDone);
      setError(initError);
    }
  }, [initDone, initError]);

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
    () => categories.map((c) => ({ id: c as string, label: c as string, tags: [c as string] })),
    [categories],
  );
  return [catalogCategories, loading, error ?? new Error('Unknown error')];
};

export default useExtensionCatalogCategories;
