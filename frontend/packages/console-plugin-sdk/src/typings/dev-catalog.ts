import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { CodeRef, Extension } from './base';

namespace ExtensionProperties {
  export interface DevCatalogModel {
    model: K8sKind;
    normalize: (data: K8sResourceKind[]) => K8sResourceKind[];
  }

  export interface CatalogItemType {
    /** Type for the catalog item. */
    type: string;
    /** Title fpr the catalog item. */
    title: string;
    /** Description for the type specific catalog. */
    catalogDescription: string;
    /** Description for the catalog item type. */
    typeDescription: string;
    /** Custom filters specific to the catalog item  */
    filters?: CatalogFilter[];
    /** Custom groupings specific to the catalog item */
    groupings?: CatalogGrouping[];
  }

  export interface CatalogItemProvider {
    /** Type ID for the catalog item type. */
    type: string;
    /** Fetch items and normalize it for the catalog. Value is a react effect hook. */
    provider: CodeRef<CatalogExtensionHook<CatalogItem[]>>;
  }
}

export interface DevCatalogModel extends Extension<ExtensionProperties.DevCatalogModel> {
  type: 'DevCatalogModel';
}

export interface CatalogItemType extends Extension<ExtensionProperties.CatalogItemType> {
  type: 'Catalog/ItemType';
}

export interface CatalogItemProvider extends Extension<ExtensionProperties.CatalogItemProvider> {
  type: 'Catalog/ItemProvider';
}

export const isDevCatalogModel = (e: Extension): e is DevCatalogModel => {
  return e.type === 'DevCatalogModel';
};

export const isCatalogItemType = (e: Extension): e is CatalogItemType => {
  return e.type === 'Catalog/ItemType';
};

export const isCatalogItemProvider = (e: Extension): e is CatalogItemProvider => {
  return e.type === 'Catalog/ItemProvider';
};

export type CatalogExtensionHookResult<T> = [T, boolean, any];

export type CatalogExtensionHookOptions = {
  namespace: string;
};

export type CatalogExtensionHook<T> = (
  options: CatalogExtensionHookOptions,
) => CatalogExtensionHookResult<T>;

export type CatalogItem = {
  uid: string;
  type: string;
  name: string;
  provider?: string;
  description?: string;
  tags?: string[];
  creationTimestamp?: string;
  supportUrl?: string;
  documentationUrl?: string;
  attributes?: {
    [key: string]: string;
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
    descriptions?: CatalogItemDetailsDescription[];
  };
};

export type CatalogItemDetailsProperty = {
  label: string;
  value: string | React.ReactNode;
};

export type CatalogItemDetailsDescription = {
  label?: string;
  value: string | React.ReactNode;
};

export type CatalogFilter = {
  label: string;
  attribute: string;
};

export type CatalogGrouping = {
  label: string;
  attribute: string;
};
