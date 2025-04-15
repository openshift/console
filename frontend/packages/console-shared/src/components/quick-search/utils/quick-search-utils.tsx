import * as React from 'react';
import { NavigateFunction } from 'react-router-dom';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { removeQueryArgument } from '@console/internal/components/utils';
import { keywordCompare } from '../../catalog';

export const quickSearch = (items: CatalogItem[], query: string) => {
  return keywordCompare(query, items);
};

export const handleCta = async (
  e: React.SyntheticEvent,
  item: CatalogItem,
  navigate: NavigateFunction,
  closeModal: () => void,
  fireTelemetryEvent: (event: string, properties?: {}) => void,
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
    removeQueryArgument('catalogSearch');
  } else navigate(href);
};
