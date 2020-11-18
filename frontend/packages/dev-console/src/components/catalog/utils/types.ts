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
  field?: string;
  values?: string[];
  subcategories?: Record<string, CatalogSubcategory>;
};

export type CatalogSubcategory = {
  id: string;
  label: string;
  field?: string;
  values?: string[];
};

export type CatalogCategories = Record<string, CatalogCategory>;
