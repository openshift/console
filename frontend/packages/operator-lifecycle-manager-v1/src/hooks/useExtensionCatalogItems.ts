import * as React from 'react';
import { usePoll } from '@console/internal/components/utils';
import { ExtensionCatalogDatabaseContext } from '../contexts/ExtensionCatalogDatabaseContext';
import { getItems, openDatabase } from '../database/indexeddb';
import { ExtensionCatalogItem } from '../database/types';

type UseExtensionCatalogItems = () => [ExtensionCatalogItem[], boolean, Error];
export const useExtensionCatalogItems: UseExtensionCatalogItems = () => {
  const { done: initDone, error: initError } = React.useContext(ExtensionCatalogDatabaseContext);
  const [items, setItems] = React.useState<ExtensionCatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error>();

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
  usePoll(tick, 3000);

  return [items, loading, error];
};
