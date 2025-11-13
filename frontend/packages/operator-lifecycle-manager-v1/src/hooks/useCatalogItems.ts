import { useState, useMemo, useCallback } from 'react';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import { consoleFetch } from '@console/dynamic-plugin-sdk/src/lib-core';
import { getConsoleRequestHeaders } from '@console/dynamic-plugin-sdk/src/utils/fetch';
import { ONE_SECOND } from '@console/shared/src/constants/time';
import { usePoll } from '@console/shared/src/hooks/usePoll';
import { OLMCatalogItem } from '../types';
import { normalizeCatalogItem } from '../utils/catalog-item';

export type OLMCatalogItemData = {
  categories: string[];
  latestVersion: string;
};

type UseCatalogItems = () => [CatalogItem<OLMCatalogItemData>[], boolean, string];
const useCatalogItems: UseCatalogItems = () => {
  const [olmCatalogItems, setOLMCatalogItems] = useState<OLMCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastModified, setLastModified] = useState('');

  const headers = useMemo(() => {
    const consoleHeaders = getConsoleRequestHeaders();
    return {
      ...consoleHeaders,
      'If-Modified-Since': lastModified,
      'Cache-Control': 'max-age=300',
    };
  }, [lastModified]);

  // Fetch function that only updates state on 200 responses
  const fetchItems = useCallback(() => {
    consoleFetch('/api/olm/catalog-items/', { headers })
      .then((response) => {
        if (response.status === 304) {
          return null;
        }

        // Only update state on successful 200 response
        if (response.status === 200) {
          setLastModified((current) => response.headers.get('Last-Modified') || current);
          return response.json();
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      })
      .then((olmItems: OLMCatalogItem[] | null) => {
        if (olmItems !== null) {
          setOLMCatalogItems(olmItems);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.toString());
        setLoading(false);
      });
  }, [headers]);

  usePoll(fetchItems, 30 * ONE_SECOND);

  const items = useMemo(() => olmCatalogItems.map(normalizeCatalogItem), [olmCatalogItems]);

  return [items, loading, error];
};

export default useCatalogItems;
