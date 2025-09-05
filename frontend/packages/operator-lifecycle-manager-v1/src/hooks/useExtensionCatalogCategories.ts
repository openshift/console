// This file will be removed as part of https://issues.redhat.com//browse/CONSOLE-4668
import * as React from 'react';
import { CatalogCategory } from '@console/dynamic-plugin-sdk/src';
import { usePoll } from '@console/internal/components/utils';
import { ExtensionCatalogDatabaseContext } from '../contexts/ExtensionCatalogDatabaseContext';
import { getUniqueIndexKeys, openDatabase } from '../database/indexeddb';

export const useExtensionCatalogCategories = (): [CatalogCategory[], boolean, string] => {
  const { done: initDone, error: initError } = React.useContext(ExtensionCatalogDatabaseContext);
  const [categories, setCategories] = React.useState<IDBValidKey[]>([]);
  const [loading, setLoading] = React.useState(!initDone);
  const [error, setError] = React.useState(initError.toString() || '');

  React.useEffect(() => {
    if (!initDone || initError) {
      setLoading(!initDone);
      setError(initError.toString() || '');
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
  return [catalogCategories, loading, error];
};

export default useExtensionCatalogCategories;
