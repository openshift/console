import { useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { usePoll } from '@console/internal/components/utils';
import { ExtensionCatalogDatabaseContext } from '../contexts/ExtensionCatalogDatabaseContext';
import { getItems, openDatabase } from '../database/indexeddb';
import { normalizeExtensionCatalogItem } from '../fbc/catalog-item';
import { ExtensionCatalogItem } from '../fbc/types';

type UseExtensionCatalogItems = () => [CatalogItem[], boolean, Error];
export const useExtensionCatalogItems: UseExtensionCatalogItems = () => {
  const { done: initDone, error: initError } = useContext(ExtensionCatalogDatabaseContext);
  const [items, setItems] = useState<ExtensionCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error>();

  useEffect(() => {
    if (!initDone || initError) {
      setLoading(!initDone);
      setError(initError);
    }
  }, [initDone, initError]);

  const tick = useCallback(() => {
    if (initDone && !initError) {
      openDatabase('olm')
        .then((database) => getItems<ExtensionCatalogItem>(database, 'extension-catalog'))
        .then((i) => {
          setItems(i);
          setError(null);
          setLoading(false);
        })
        .catch((e) => {
          setError(e);
          setLoading(false);
          setItems([]);
        });
    }
  }, [initDone, initError]);

  // Poll IndexedDB (IDB) every 10 seconds
  usePoll(tick, 10000);

  const normalizedItems = useMemo<CatalogItem[]>(() => items.map(normalizeExtensionCatalogItem), [
    items,
  ]);

  return [normalizedItems, loading, error];
};

export default useExtensionCatalogItems;
