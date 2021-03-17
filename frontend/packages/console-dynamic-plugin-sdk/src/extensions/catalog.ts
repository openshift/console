import * as React from 'react';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';

namespace ExtensionProperties {
  export type CatalogItemType = {
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
  };

  export type CatalogItemProvider = {
    /** Type ID for the catalog item type. */
    type: string;
    /** Fetch items and normalize it for the catalog. Value is a react effect hook. */
    provider: EncodedCodeRef;
    /** Priority for this provider. Defaults to 0. Higher priority providers may override catalog
        items provided by other providers. */
    priority?: number;
  };

  export type CatalogItemFilter = {
    /** Type ID for the catalog item type. */
    type: string;
    /** Filters items of a specific type. Value is a function that takes CatalogItem[] and returns a subset based on the filter criteria. */
    filter: EncodedCodeRef;
  };

  export type CatalogItemProviderCodeRefs = {
    provider: CodeRef<CatalogExtensionHook<CatalogItem[]>>;
  };

  export type CatalogItemFilterCodeRefs = {
    filter: CodeRef<(item: CatalogItem) => boolean>;
  };
}

// Extension types

export type CatalogItemType = Extension<ExtensionProperties.CatalogItemType> & {
  type: 'console.catalog/item-type';
};

export type CatalogItemProvider = Extension<ExtensionProperties.CatalogItemProvider> & {
  type: 'console.catalog/item-provider';
};

export type CatalogItemFilter = Extension<ExtensionProperties.CatalogItemFilter> & {
  type: 'console.catalog/item-filter';
};

export type ResolvedCatalogItemProvider = UpdateExtensionProperties<
  CatalogItemProvider,
  ExtensionProperties.CatalogItemProviderCodeRefs
>;

export type ResolvedCatalogItemFilter = UpdateExtensionProperties<
  CatalogItemFilter,
  ExtensionProperties.CatalogItemFilterCodeRefs
>;

// Type guards

export const isCatalogItemType = (e: Extension): e is CatalogItemType => {
  return e.type === 'console.catalog/item-type';
};

export const isCatalogItemProvider = (e: Extension): e is ResolvedCatalogItemProvider => {
  return e.type === 'console.catalog/item-provider';
};

export const isCatalogItemFilter = (e: Extension): e is ResolvedCatalogItemFilter => {
  return e.type === 'console.catalog/item-filter';
};

// Support types

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
  cta?: {
    label: string;
    href?: string;
    callback?: () => void;
  };
  icon?: {
    url?: string;
    class?: string;
  };
  details?: {
    properties?: CatalogItemDetailsProperty[];
    descriptions?: CatalogItemDetailsDescription[];
  };
  // Optional text only badges for the catalog item which will be rendered on the tile and details panel.
  badges?: CatalogItemBadge[];
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

export type CatalogItemBadge = {
  text: string;
  color?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey';
  icon?: React.ReactNode;
  variant?: 'outline' | 'filled';
};
