import * as React from 'react';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { usePoll } from '@console/internal/components/utils';
import { ExtensionCatalogDatabaseContext } from '../contexts/ExtensionCatalogDatabaseContext';
import { getItems, openDatabase } from '../database/indexeddb';
import { normalizeExtensionCatalogItem } from '../fbc/catalog-item';
import { ExtensionCatalogItem } from '../fbc/types';

type UseExtensionCatalogItems = () => [CatalogItem[], boolean, Error | null];
export const useExtensionCatalogItems: UseExtensionCatalogItems = () => {
  const { done: initDone, error: initError } = React.useContext(ExtensionCatalogDatabaseContext);
  const [items, setItems] = React.useState<ExtensionCatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!initDone || initError) {
      setLoading(!initDone);
      setError(initError);
    }
  }, [initDone, initError]);

  const tick = React.useCallback(() => {
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

  const normalizedItems = React.useMemo<CatalogItem[]>(
    () => items.map(normalizeExtensionCatalogItem),
    [items],
  );

  return [normalizedItems, loading, error];
};

export default useExtensionCatalogItems;
