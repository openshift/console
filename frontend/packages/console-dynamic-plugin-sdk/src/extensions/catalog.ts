import * as React from 'react';
import { ExtensionHook } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

export type CatalogItemType = ExtensionDeclaration<
  'console.catalog/item-type',
  {
    /** Type for the catalog item. */
    type: string;
    /** Title for the catalog item. */
    title: string;
    /** Description for the type specific catalog. */
    catalogDescription?: string;
    /** Description for the catalog item type. */
    typeDescription?: string;
    /** Custom filters specific to the catalog item.  */
    filters?: CatalogItemAttribute[];
    /** Custom groupings specific to the catalog item. */
    groupings?: CatalogItemAttribute[];
  }
>;

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

export type SupportedCatalogExtensions = CatalogItemType | CatalogItemProvider | CatalogItemFilter;

// Type guards

export const isCatalogItemType = (e: Extension): e is CatalogItemType => {
  return e.type === 'console.catalog/item-type';
};

export const isCatalogItemProvider = (e: Extension): e is CatalogItemProvider => {
  return e.type === 'console.catalog/item-provider';
};

export const isCatalogItemFilter = (e: Extension): e is CatalogItemFilter => {
  return e.type === 'console.catalog/item-filter';
};

// Support types

export type CatalogExtensionHookOptions = {
  namespace: string;
};

export type CatalogItem<T extends any = any> = {
  uid: string;
  type: string;
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
