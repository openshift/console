import { K8sKind, K8sResourceKind } from '@console/internal/module/k8s';
import { Extension } from './base';

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
    /** Custom filters specific to the catalog item.  */
    filters?: CatalogItemAttribute[];
    /** Custom groupings specific to the catalog item. */
    groupings?: CatalogItemAttribute[];
  }

  export interface CatalogItemProvider {
    /** Type ID for the catalog item type. */
    type: string;
    /** Fetch items and normalize it for the catalog. Value is a react effect hook. */
    provider: () => Promise<CatalogExtensionHook<CatalogItem[]>>;
    /** Priority for this provider. Defaults to 0. Higher priority providers may override catalog
        items provided by other providers. */
    priority?: number;
  }

  export interface CatalogItemFilter {
    /** Type ID for the catalog item type. */
    type: string;
    /** Filters items of a specific type. Value is a function that takes CatalogItem[] and returns a subset based on the filter criteria. */
    filter: () => Promise<(items: CatalogItem[]) => CatalogItem[]>;
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

export interface CatalogItemFilter extends Extension<ExtensionProperties.CatalogItemFilter> {
  type: 'Catalog/ItemFilter';
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

export const isCatalogItemFilter = (e: Extension): e is CatalogItemFilter => {
  return e.type === 'Catalog/ItemFilter';
};

export type CatalogExtensionHookResult<T> = [T, boolean, any];

export type CatalogExtensionHookOptions = {
  namespace: string;
};

export type CatalogExtensionHook<T> = (
  options: CatalogExtensionHookOptions,
) => CatalogExtensionHookResult<T>;

export type CatalogItem<T extends any = any> = {
  uid: string;
  type: string;
  name: string;
  provider?: string;
  // Used as the tile description. If provided as a string, the description is truncated to 3 lines.
  // If provided as a ReactNode, the contents will not be truncated.
  // This description will also be shown in the side panel if there are no `details.descriptions`.
  description?: string | React.ReactNode;
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
  // Optional data attached by the provider.
  // May be consumed by filters.
  // `data` for each `type` of CatalogItem should implement the same interface.
  data?: T;
};

export type CatalogItemDetailsProperty = {
  label: string;
  value: string | React.ReactNode;
};

export type CatalogItemDetailsDescription = {
  label?: string;
  value: string | React.ReactNode;
};

export type CatalogItemAttribute = {
  label: string;
  attribute: string;
};
