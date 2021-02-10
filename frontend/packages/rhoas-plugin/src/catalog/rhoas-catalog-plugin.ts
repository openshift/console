import { CatalogItemProvider, CatalogItemType, Plugin } from '@console/plugin-sdk';
import { rhoasProvider } from './providers';

export type CatalogConsumedExtensions = CatalogItemProvider | CatalogItemType;

export const CATALOG_TYPE = 'RhoasService';
export const rhoasCatalogPlugin: Plugin<CatalogConsumedExtensions> = [
  {
    type: 'Catalog/ItemType',
    properties: {
      type: CATALOG_TYPE,
      title: '%rhoas-plugin~Managed Services%',
      catalogDescription: '%rhoas-plugin~Managed Services%',
      typeDescription: '%rhoas-plugin~Managed Services%',
      filters: [{ label: 'Managed', attribute: 'Managed' }],
    },
    flags: {
      required: [],
    },
  },
  {
    type: 'Catalog/ItemProvider',
    properties: {
      type: CATALOG_TYPE,
      provider: rhoasProvider,
    },
    flags: {
      required: [],
    },
  },
];
