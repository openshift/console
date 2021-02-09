import { CatalogItemProvider, CatalogItemType, Plugin } from '@console/plugin-sdk';
import { rhoasProvider } from './providers';

export type CatalogConsumedExtensions = CatalogItemProvider | CatalogItemType;

export const CATALOG_TYPE = "RhoasService";
export const rhoasCatalogPlugin: Plugin<CatalogConsumedExtensions> = [
  {
    type: 'Catalog/ItemType',
    properties: {
      type: CATALOG_TYPE,
      title: 'Managed Services',
      catalogDescription: 'Browse managed services catalog',
      typeDescription: 'Managed services allow you to connect with external resources that are managed by Red Hat',
      filters: [
        { label: "Managed", attribute: "Managed" }
      ],
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
