import * as React from 'react';
import { usePoll } from '@console/internal/components/utils';
import {
  InstalledState,
  OperatorHubItem,
} from '@console/operator-lifecycle-manager/src/components/operator-hub';
import { ExtensionCatalogDatabaseContext } from '../contexts/ExtensionCatalogDatabaseContext';
import { getItems, openDatabase } from '../database/indexeddb';
import { ExtensionCatalogItem } from '../database/types';

type NormalizeExtensionCatalogItem = (pkg: ExtensionCatalogItem) => OperatorHubItem;
const normalizeExtensionCatalogItem: NormalizeExtensionCatalogItem = ({
  categories,
  capabilities,
  description,
  displayName,
  icon,
  infrastructureFeatures,
  keywords,
  longDescription,
  name,
  provider,
  source,
  validSubscription,
}) => ({
  authentication: null,
  capabilityLevel: capabilities,
  catalogSource: '',
  catalogSourceNamespace: '',
  categories,
  cloudCredentials: null,
  description: description || longDescription,
  infraFeatures: infrastructureFeatures,
  infrastructure: null,
  installed: false,
  installState: InstalledState.NotInstalled,
  kind: null,
  longDescription: longDescription || description,
  name: displayName || name,
  obj: null,
  provider,
  source,
  tags: keywords,
  uid: name,
  validSubscription,
  ...(icon ? { imgUrl: `data:${icon.mediatype};base64,${icon.base64data}` } : {}),
});

type UseExtensionCatalogItems = () => [OperatorHubItem[], boolean, Error];
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

  const normalizedItems = React.useMemo<OperatorHubItem[]>(
    () => items.map(normalizeExtensionCatalogItem),
    [items],
  );

  return [normalizedItems, loading, error];
};
