import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { CodeRef, Extension } from './base';

namespace ExtensionProperties {
  export interface DevCatalogModel {
    model: K8sKind;
    normalize: (data: K8sResourceKind[]) => K8sResourceKind[];
  }

  export interface CatalogItemProvider {
    /** Type for the catalog item. */
    type: string;
    /** Title fpr the catalog item. */
    title: string;
    /** Catalog ID for which this provider contributes to. Idea here is to be able to support multiple catalogs. */
    catalog: string;
    /** Fetch items and normalize it for the catalog. Value is a react effect hook. */
    provider: CodeRef<() => CatalogItemProviderResult>;
    /** Description for the catalog item. */
    description?: string;
    /** Custom filters specific to the catalog item  */
    filters?: CodeRef<CatalogFilters>;
    /** Custom groupings specific to the catalog item */
    groupings?: CodeRef<CatalogGroupings>;
  }
}

export interface DevCatalogModel extends Extension<ExtensionProperties.DevCatalogModel> {
  type: 'DevCatalogModel';
}

export interface CatalogItemProvider extends Extension<ExtensionProperties.CatalogItemProvider> {
  type: 'Catalog/ItemProvider';
}

export const isDevCatalogModel = (e: Extension): e is DevCatalogModel => {
  return e.type === 'DevCatalogModel';
};

export const isCatalogItemProvider = (e: Extension): e is CatalogItemProvider => {
  return e.type === 'Catalog/ItemProvider';
};

export type CatalogItemProviderResult = [CatalogItem[], boolean, any];

type Metadata = {
  uid?: string;
  name?: string;
  namespace?: string;
  creationTimestamp?: string;
};

export type CatalogItem = {
  type?: string;
  name?: string;
  provider?: string;
  description?: string;
  tags?: string[];
  obj?: {
    metadata?: Metadata;
    csv?: {
      kind?: string;
      spec: { displayName: string };
      metadata?: Metadata;
    };
  };
  cta: {
    label: string;
    href: string;
  };
  icon?: {
    url?: string;
    class?: string;
  };
  details?: {
    properties?: CatalogItemDetailsProperty[];
    descriptions?: CatalogItemDetailsProperty[];
  };
};

export type CatalogItemDetailsProperty = {
  type: CatalogItemDetailsPropertyVariant;
  title?: string;
  label?: string;
  value: string | (() => Promise<string>);
};

export enum CatalogItemDetailsPropertyVariant {
  TEXT = 'TEXT',
  LINK = 'LINK',
  EXTERNAL_LINK = 'EXTERNAL_LINK',
  MARKDOWN = 'MARKDOWN',
  ASYNC_MARKDOWN = 'ASYNC_MARKDOWN',
  TIMESTAMP = 'TIMESTAMP',
}

export type CatalogItemFilterProperties = {
  [key: string]: string;
};

export type CatalogItemGroupingProperties = {
  [key: string]: string;
};

export type CatalogFilters = { [key: string]: CatalogItemFilterProperties[] };

export type CatalogGroupings = { [key: string]: CatalogItemGroupingProperties[] };
