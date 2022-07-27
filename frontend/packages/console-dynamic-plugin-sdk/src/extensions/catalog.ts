import * as React from 'react';
import {
  CatalogItemFilter as CoreCatalogItemFilter,
  CatalogItemProvider as CoreCatalogItemProvider,
  CatalogItemType as CoreCatalogItemType,
} from '@openshift/dynamic-plugin-sdk';
import { ExtensionHook } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';
import { RepackageExtension } from './data-types';

export type CatalogItemType = RepackageExtension<'console.catalog/item-type', CoreCatalogItemType>;

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

export type CatalogItemProvider = RepackageExtension<
  'console.catalog/item-provider',
  CoreCatalogItemProvider
>;

export type CatalogItemFilter = RepackageExtension<
  'console.catalog/item-filter',
  CoreCatalogItemFilter
>;

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
