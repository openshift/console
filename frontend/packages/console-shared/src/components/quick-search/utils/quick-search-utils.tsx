import * as React from 'react';
import { keywordCompare } from '@console/dev-console/src/components/catalog/utils/catalog-utils';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { history, removeQueryArgument } from '@console/internal/components/utils';

export const quickSearch = (items: CatalogItem[], query: string) => {
  return keywordCompare(query, items);
};

export const handleCta = (
  e: React.SyntheticEvent,
  item: CatalogItem,
  closeModal: () => void,
  fireTelemetryEvent: (event: string, properties?: {}) => void,
) => {
  e.preventDefault();
  const { href, callback } = item.cta;
  if (callback) {
    fireTelemetryEvent('Quick Search Used', {
      id: item.uid,
      type: item.type,
      name: item.name,
    });
    closeModal();
    callback();
    removeQueryArgument('catalogSearch');
  } else history.push(href);
};
