import * as React from 'react';
import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { consoleFetchJSON } from '@console/dynamic-plugin-sdk/src/lib-core';
import { usePoll } from '@console/internal/components/utils';
import { OLMCatalogItem } from '../types';
import { normalizeCatalogItem } from '../utils/catalog-item';

type UseCatalogItems = () => [CatalogItem[], boolean, Error];
const useCatalogItems: UseCatalogItems = () => {
  const [items, setItems] = React.useState<OLMCatalogItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error>();

  const tick = React.useCallback(() => {
    consoleFetchJSON('/api/olm/catalog-items/')
      .then((olmItems: OLMCatalogItem[]) => {
        setItems(olmItems);
        setLoading(false);
      })
      .catch((err) => {
        setError(err);
        setLoading(false);
      });
  }, []);

  usePoll(tick, 60000);

  const catalogItems = React.useMemo(() => items.map(normalizeCatalogItem), [items]);

  return [catalogItems, loading, error];
};

export default useCatalogItems;
