import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { CatalogItem } from '@console/dynamic-plugin-sdk/src/extensions/catalog';
import { ONE_SECOND } from '@console/shared/src/constants/time';
import { usePoll } from '@console/shared/src/hooks/usePoll';
import { coFetch } from '@console/shared/src/utils/console-fetch';
import {
  getConsoleRequestHeaders,
  normalizeConsoleHeaders,
} from '@console/shared/src/utils/console-fetch-utils';
import type { OLMCatalogItem } from '../types';
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
  const abortControllerRef = useRef<AbortController>();

  const headers = useMemo(() => {
    const consoleHeaders = getConsoleRequestHeaders();
    const normalizedHeaders = normalizeConsoleHeaders(consoleHeaders);
    return {
      ...normalizedHeaders,
      'If-Modified-Since': lastModified,
      'Cache-Control': 'max-age=300',
    };
  }, [lastModified]);

  const fetchItems = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    coFetch('/api/olm/catalog-items/', { headers, signal: abortControllerRef.current.signal })
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
        if (err.name === 'AbortError') return;
        setError(err.toString());
        setLoading(false);
      });
  }, [headers]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  usePoll(fetchItems, 30 * ONE_SECOND);

  const items = useMemo(() => olmCatalogItems.map(normalizeCatalogItem), [olmCatalogItems]);

  return [items, loading, error];
};

export default useCatalogItems;
