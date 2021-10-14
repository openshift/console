import { CatalogItem, CatalogItemType, ResolvedExtension } from '@console/dynamic-plugin-sdk';
import { CatalogType } from '../../catalog';

export type QuickSearchProvider = {
  catalogType: string;
  items: CatalogItem[];
  loaded: boolean;
  getCatalogURL: (searchTerm: string, ns?: string) => string;
  catalogLinkLabel: string;
  extensions: ResolvedExtension<CatalogItemType>[];
};

export type QuickSearchProviders = QuickSearchProvider[];

export type CatalogLinkData = {
  label: string;
  to: string;
  catalogType: string;
};

export type QuickSearchData = {
  filteredItems: CatalogItem[];
  viewAllLinks: CatalogLinkData[];
  catalogItemTypes: CatalogType[];
};
