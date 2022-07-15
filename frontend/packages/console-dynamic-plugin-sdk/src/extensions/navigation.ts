import {
  NavItem as CoreNavItem,
  HrefNavItem as CoreHrefNavItem,
  ResourceNSNavItem as CoreResourceNSNavItem,
  Separator as CoreSeparator,
} from '@openshift/dynamic-plugin-sdk';
import { ExtensionK8sModel } from '../api/common-types';
import { Extension, ExtensionDeclaration } from '../types';
import { RepackageExtension } from './data-types';

type NavItemProperties = {
  /** A unique identifier for this item. */
  id: string;
  /** The perspective ID to which this item belongs to. If not specified, contributes to the default perspective. */
  perspective?: string;
  /** Navigation section to which this item belongs to. If not specified, render this item as a top level link. */
  section?: string;
  /** Adds data attributes to the DOM. */
  dataAttributes?: { [key: string]: string };
  /** Mark this item as active when the URL starts with one of these paths. */
  startsWith?: string[];
  /** Insert this item before the item referenced here. For arrays, the first one found in order is used. */
  insertBefore?: string | string[];
  /** Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. */
  insertAfter?: string | string[];
};

export type NavItem = RepackageExtension<'console.navigation/href', CoreNavItem>;

export type HrefNavItem = RepackageExtension<'console.navigation/href', CoreHrefNavItem>;

export type ResourceNSNavItem = RepackageExtension<
  'console.navigation/resource-ns',
  CoreResourceNSNavItem
>;

export type ResourceClusterNavItem = ExtensionDeclaration<
  'console.navigation/resource-cluster',
  NavItemProperties & {
    /** Overrides the default name. If not supplied the name of the link will equal the plural value of the model. */
    name?: string;
    /** The model for which this nav item links to. */
    model: ExtensionK8sModel;
  }
>;

export type Separator = RepackageExtension<'console.navigation/separator', CoreSeparator>;

export type NavSection = ExtensionDeclaration<
  'console.navigation/section',
  Omit<NavItemProperties, 'startsWith' | 'section'> & {
    /** Name of this section. If not supplied, only a separator will be shown above the section. */
    name?: string;
  }
>;

export type NavExtension =
  | NavSection
  | Separator
  | HrefNavItem
  | ResourceNSNavItem
  | ResourceClusterNavItem;

// Type guards

export const isHrefNavItem = (e: Extension): e is HrefNavItem =>
  e.type === 'console.navigation/href';

export const isResourceNSNavItem = (e: Extension): e is ResourceNSNavItem =>
  e.type === 'console.navigation/resource-ns';

export const isResourceClusterNavItem = (e: Extension): e is ResourceClusterNavItem =>
  e.type === 'console.navigation/resource-cluster';

export const isSeparator = (e: Extension): e is Separator =>
  e.type === 'console.navigation/separator';

export const isNavSection = (e: Extension): e is NavSection =>
  e.type === 'console.navigation/section';

export const isNavItem = (e: Extension): e is NavItem =>
  isHrefNavItem(e) || isResourceNSNavItem(e) || isResourceClusterNavItem(e);

export const isNavItemOrSeparator = (e: Extension): e is NavItem | Separator =>
  isNavItem(e) || isSeparator(e);

export const isNavExtension = (e: Extension): e is NavExtension =>
  isNavItem(e) || isSeparator(e) || isNavSection(e);
