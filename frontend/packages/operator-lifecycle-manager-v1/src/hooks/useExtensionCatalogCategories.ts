import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { usePoll } from '@console/internal/components/utils';
import { CatalogCategory } from '@console/shared/src/components/catalog/utils/types';
import { ExtensionCatalogDatabaseContext } from '../contexts/ExtensionCatalogDatabaseContext';
import { getUniqueIndexKeys, openDatabase } from '../database/indexeddb';

export const useExtensionCatalogCategories = (): [CatalogCategory[], boolean, Error] => {
  const { done: initDone, error: initError } = useContext(ExtensionCatalogDatabaseContext);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!initDone);
  const [error, setError] = useState<Error>(initError);

  useEffect(() => {
    if (!initDone || initError) {
      setLoading(!initDone);
      setError(initError);
    }
  }, [initDone, initError]);

  const tick = useCallback(() => {
    if (initDone && !initError) {
      openDatabase('olm')
        .then((database) => getUniqueIndexKeys(database, 'extension-catalog', 'categories'))
        .then((c) => {
          setLoading(false);
          setError(null);
          setCategories(c);
        })
        .catch((e) => {
          setLoading(false);
          setError(e);
          setCategories([]);
        });
    }
  }, [initDone, initError]);

  // Poll IndexedDB (IDB) every 10 seconds
  usePoll(tick, 10000);
  const catalogCategories = useMemo<CatalogCategory[]>(
    () => categories.map((c) => ({ id: c, label: c, tags: [c] })),
    [categories],
  );
  return [catalogCategories, loading, error];
};
