import * as React from 'react';
import { getConsoleRequestHeaders } from '@console/dynamic-plugin-sdk/dist/core/lib/utils/fetch';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { consoleFetch } from '@console/dynamic-plugin-sdk/src/lib-core';
import { usePoll } from '@console/shared/src/hooks/usePoll';
import { OLMCatalogItem } from '../types';
import { normalizeCatalogItem } from '../utils/catalog-item';

export type OLMCatalogItemData = {
  categories: string[];
  latestVersion: string;
};

type UseCatalogItems = () => [CatalogItem<OLMCatalogItemData>[], boolean, string];
const useCatalogItems: UseCatalogItems = () => {
  const [olmCatalogItems, setOLMCatalogItems] = React.useState<OLMCatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [lastModified, setLastModified] = React.useState('');

  const headers = React.useMemo(() => {
    const consoleHeaders = getConsoleRequestHeaders();
    return {
      ...consoleHeaders,
      'If-Modified-Since': lastModified,
      'Cache-Control': 'max-age=300',
    };
  }, [lastModified]);

  // Fetch function that only updates state on 200 responses
  const fetchItems = React.useCallback(() => {
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
        setOLMCatalogItems((current) => olmItems ?? current);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.toString());
        setLoading(false);
      });
  }, [headers]);

  usePoll(fetchItems, 5000); // TODO, make this longer

  const items = React.useMemo(() => olmCatalogItems.map(normalizeCatalogItem), [olmCatalogItems]);

  return [items, loading, error];
};

export default useCatalogItems;
