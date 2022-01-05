import { CatalogItem, CatalogItemType } from '@console/dynamic-plugin-sdk/src/extensions';
import { ResolvedExtension } from '@console/dynamic-plugin-sdk/src/types';

export enum CatalogQueryParams {
  TYPE = 'catalogType',
  CATEGORY = 'category',
  KEYWORD = 'keyword',
  SORT_ORDER = 'sortOrder',
  GROUPING = 'grouping',
  SELECTED_ID = 'selectedId',
}

export enum CatalogSortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export type CatalogFilterItem = {
  label?: string;
  value: string;
  active: boolean;
};

export type CatalogFilter = { [key: string]: CatalogFilterItem };

export type CatalogFilters = Record<string, CatalogFilter>;

export type CatalogFilterCounts = Record<string, { [key: string]: number }>;

export type CatalogTypeCounts = Record<string, number>;

export type CatalogStringMap = Record<string, string>;

export type CatalogType = {
  label: string;
  value: string;
  description: string;
};

export type CatalogCategory = {
  id: string;
  label: string;
  tags?: string[];
  subcategories?: CatalogSubcategory[];
};

export type CatalogSubcategory = {
  id: string;
  label: string;
  tags?: string[];
};

export type CatalogService = {
  type: string;
  items: CatalogItem[];
  itemsMap: { [type: string]: CatalogItem[] };
  loaded: boolean;
  loadError: any;
  searchCatalog: (query: string) => CatalogItem[];
  catalogExtensions: ResolvedExtension<CatalogItemType>[];
};
