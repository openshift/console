import type { SyntheticEvent } from 'react';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { keywordCompare } from '../../catalog';

export const quickSearch = (items: CatalogItem[], query: string) => {
  return keywordCompare(query, items);
};

export const handleCta = async (
  e: SyntheticEvent,
  item: CatalogItem,
  closeModal: () => void,
  fireTelemetryEvent: (event: string, properties?: {}) => void,
  navigate: (url: string) => void,
  removeQueryArg: (key: string) => void,
  callbackProps: { [key: string]: string } = {},
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
    await callback(callbackProps);
    removeQueryArg('catalogSearch');
  } else navigate(href);
};
