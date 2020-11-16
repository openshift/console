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

export type CatalogFilters = Record<string, CatalogFilter | CatalogFilterItem>;

export type CatalogFilterCounts = Record<string, { [key: string]: number }>;

export type CatalogType = {
  label: string;
  value: string;
  description: string;
  numItems: number;
};

export type CatalogCategory = Record<string, string | Record<string, string | Record<string, any>>>;

export type CatalogCategories = Record<string, CatalogCategory>;
