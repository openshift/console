import * as React from 'react';
import { ExtensionHook } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

/** This extension allows plugins to contribute a new type of catalog item. For example, a Helm plugin can define
    a new catalog item type as HelmCharts that it wants to contribute to the Developer Catalog. */
export type CatalogItemType = ExtensionDeclaration<
  'console.catalog/item-type',
  {
    /** Type for the catalog item. */
    type: string;
    /** Title for the catalog item. */
    title: string;
    /** Description for the type specific catalog. */
    catalogDescription?: string | CodeRef<React.ReactNode>;
    /** Description for the catalog item type. */
    typeDescription?: string;
    /** Custom filters specific to the catalog item.  */
    filters?: CatalogItemAttribute[];
    /** Custom groupings specific to the catalog item. */
    groupings?: CatalogItemAttribute[];
  }
>;

/** This extension allows plugins to contribute extra metadata like custom filters or groupings for any catalog item type.
    For example, a plugin can attach a custom filter for HelmCharts that can filter based on chart provider. */
export type CatalogItemTypeMetadata = ExtensionDeclaration<
  'console.catalog/item-type-metadata',
  {
    /** Type for the catalog item. */
    type: string;
    /** Custom filters specific to the catalog item.  */
    filters?: CatalogItemAttribute[];
    /** Custom groupings specific to the catalog item. */
    groupings?: CatalogItemAttribute[];
  }
>;

/** This extension allows plugins to contribute a provider for a catalog item type. For example, a Helm Plugin can add a provider
    that fetches all the Helm Charts. This extension can also be used by other plugins to add more items to a specific catalog item type. */
export type CatalogItemProvider = ExtensionDeclaration<
  'console.catalog/item-provider',
  {
    /** The unique identifier for the catalog this provider contributes to. */
    catalogId: string | string[];
    /** Type ID for the catalog item type. */
    type: string;
    /** Title for the catalog item provider */
    title: string;
    /** Fetch items and normalize it for the catalog. Value is a react effect hook. */
    provider: CodeRef<ExtensionHook<CatalogItem[], CatalogExtensionHookOptions>>;
    /** Priority for this provider. Defaults to 0. Higher priority providers may override catalog
        items provided by other providers. */
    priority?: number;
  }
>;

/** This extension can be used for plugins to contribute a handler that can filter specific catalog items.
    For example, the plugin can contribute a filter that filters helm charts from specific provider. */
export type CatalogItemFilter = ExtensionDeclaration<
  'console.catalog/item-filter',
  {
    /** The unique identifier for the catalog this provider contributes to. */
    catalogId: string | string[];
    /** Type ID for the catalog item type. */
    type: string;
    /** Filters items of a specific type. Value is a function that takes CatalogItem[] and returns a subset based on the filter criteria. */
    filter: CodeRef<(item: CatalogItem) => boolean>;
  }
>;

/** This extension can be used to contribute a provider that adds extra metadata to specific catalog items. */
export type CatalogItemMetadataProvider = ExtensionDeclaration<
  'console.catalog/item-metadata',
  {
    /** The unique identifier for the catalog this provider contributes to. */
    catalogId: string | string[];
    /** Type ID for the catalog item type. */
    type: string;
    /** A hook which returns a function that will be used to provide metadata to catalog items of a specific type. */
    provider: CodeRef<
      ExtensionHook<CatalogItemMetadataProviderFunction, CatalogExtensionHookOptions>
    >;
  }
>;

export type SupportedCatalogExtensions =
  | CatalogItemType
  | CatalogItemTypeMetadata
  | CatalogItemProvider
  | CatalogItemFilter
  | CatalogItemMetadataProvider;

// Type guards

export const isCatalogItemType = (e: Extension): e is CatalogItemType => {
  return e.type === 'console.catalog/item-type';
};

export const isCatalogItemTypeMetadata = (e: Extension): e is CatalogItemTypeMetadata => {
  return e.type === 'console.catalog/item-type-metadata';
};

export const isCatalogItemProvider = (e: Extension): e is CatalogItemProvider => {
  return e.type === 'console.catalog/item-provider';
};

export const isCatalogItemFilter = (e: Extension): e is CatalogItemFilter => {
  return e.type === 'console.catalog/item-filter';
};

export const isCatalogItemMetadataProvider = (e: Extension): e is CatalogItemMetadataProvider => {
  return e.type === 'console.catalog/item-metadata';
};

// Support types

export type CatalogExtensionHookOptions = {
  namespace: string;
};

export type CatalogItem<T extends any = any> = {
  uid: string;
  type: string;
  typeLabel?: string | React.ReactNode;
  name: string;
  /** Optional title to render a custom title using ReactNode.
   * Rendered in catalog tile and side panel
   *  */
  title?: React.ReactNode;
  // Used as the second label next to the provider label in the list result.
  secondaryLabel?: React.ReactNode;
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
    [key: string]: any;
  };
  cta?: {
    label: string;
    href?: string;
    callback?: (props?: any) => void;
  };
  icon?: {
    url?: string;
    class?: string;
    node?: React.ReactNode;
  };
  details?: CatalogItemDetails;
  // Optional text only badges for the catalog item which will be rendered on the tile and details panel.
  badges?: CatalogItemBadge[];
  // Optional data attached by the provider.
  // May be consumed by filters.
  // `data` for each `type` of CatalogItem should implement the same interface.
  data?: T;
};

export type CatalogItemDetails = {
  properties?: CatalogItemDetailsProperty[];
  descriptions?: CatalogItemDetailsDescription[];
};

export type CatalogItemDetailsProperty = {
  label: string;
  value: string | React.ReactNode;
  isHidden?: boolean;
};

export type CatalogItemDetailsDescription = {
  label?: string;
  value: string | React.ReactNode;
};

export type CatalogItemAttribute = {
  label: string;
  attribute: string;
  description?: string;
};

export type CatalogItemBadge = {
  text: string;
  color?: 'blue' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'grey';
  icon?: React.ReactNode;
  variant?: 'outline' | 'filled';
};

export type CatalogItemMetadataProviderFunction = (
  item: CatalogItem,
) =>
  | {
      tags?: string[];
      badges?: CatalogItemBadge[];
      attributes?: {
        [key: string]: any;
      };
    }
  | undefined;
