import { ExtensionK8sModel } from '../api/common-types';
import { Extension, ExtensionDeclaration } from '../types';

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

export type NavItem = ExtensionDeclaration<
  'console.navigation/href',
  NavItemProperties & {
    name: string;
  }
>;

/**
 * This extension can be used to contribute a navigation item that points to a specific link in the UI.
 *
 * HrefNavItem provides a way to add custom navigation links to Console pages within the web application.
 * It supports namespace-aware routing and flexible positioning within the navigation.
 *
 * **Common use cases:**
 * - Adding links to custom plugin pages
 * - Creating navigation to specific Console views with parameters
 * - Adding shortcuts to custom dashboards or tools
 * - Linking to configuration or settings pages
 *
 * **Navigation features:**
 * - Automatic active state detection based on current URL
 * - Namespace-aware routing for namespaced pages
 * - Flexible positioning within navigation sections
 * - Support for custom data attributes for testing/analytics
 *
 * **URL handling:**
 * - `href` should be a relative path within the Console application
 * - `namespaced: true` appends `/ns/{activeNamespace}` to href
 * - `prefixNamespaced: true` prefixes href with `/k8s/ns/{activeNamespace}`
 * - `startsWith` array defines when link should appear active
 *
 * @example
 * ```json
 * // console-extensions.json - Custom plugin page
 * [
 *   {
 *     "type": "console.navigation/href",
 *     "properties": {
 *       "id": "custom-dashboard",
 *       "name": "My Dashboard",
 *       "href": "/my-plugin/dashboard",
 *       "section": "admin",
 *       "startsWith": ["/my-plugin/dashboard"],
 *       "dataAttributes": {"test-id": "custom-dashboard-nav"}
 *     }
 *   }
 * ]
 * ```
 *
 * @example
 * ```json
 * // console-extensions.json - Namespace-aware page
 * [
 *   {
 *     "type": "console.navigation/href",
 *     "properties": {
 *       "id": "namespace-settings",
 *       "name": "Namespace Settings",
 *       "href": "/settings",
 *       "namespaced": true,
 *       "section": "administration",
 *       "insertAfter": "namespaces"
 *     }
 *   }
 * ]
 * ```
 */
export type HrefNavItem = ExtensionDeclaration<
  'console.navigation/href',
  NavItemProperties & {
    /** The name of this item. */
    name: string;
    /** The link href value. */
    href: string;
    /** if true, adds /ns/active-namespace to the end */
    namespaced?: boolean;
    /** if true, adds /k8s/ns/active-namespace to the begining */
    prefixNamespaced?: boolean;
  }
>;

/**
 * This extension can be used to contribute a navigation item that points to a namespaced resource details page.
 *
 * ResourceNSNavItem automatically generates navigation links for Kubernetes resources,
 * handling the complex URL structure and active state detection for resource list pages.
 *
 * **Advantages over HrefNavItem:**
 * - Automatic URL generation based on resource model
 * - Built-in namespace handling for namespaced resources
 * - Automatic pluralization and naming from K8s model
 * - Consistent routing patterns with core Console resources
 *
 * **Common use cases:**
 * - Adding navigation for Custom Resource Definitions
 * - Creating shortcuts to specific resource types
 * - Organizing related resources into navigation sections
 * - Building domain-specific navigation groupings
 *
 * **Model integration:**
 * - Uses K8s model metadata for automatic link generation
 * - Inherits resource naming and pluralization rules
 * - Supports both core and custom resources
 * - Handles API group routing automatically
 *
 * @example
 * ```json
 * // console-extensions.json - Custom Resource navigation
 * [
 *   {
 *     "type": "console.navigation/resource-ns",
 *     "properties": {
 *       "id": "my-custom-resources",
 *       "model": {
 *         "group": "example.com",
 *         "version": "v1",
 *         "kind": "MyResource"
 *       },
 *       "section": "custom-resources",
 *       "insertBefore": "other-resources"
 *     }
 *   }
 * ]
 * ```
 *
 * @example
 * ```json
 * // console-extensions.json - Core resource with custom name
 * [
 *   {
 *     "type": "console.navigation/resource-ns",
 *     "properties": {
 *       "id": "application-pods",
 *       "name": "Application Pods",
 *       "model": {"group": "", "version": "v1", "kind": "Pod"},
 *       "section": "applications",
 *       "perspective": "dev"
 *     }
 *   }
 * ]
 * ```
 */
export type ResourceNSNavItem = ExtensionDeclaration<
  'console.navigation/resource-ns',
  NavItemProperties & {
    /** Overrides the default name. If not supplied the name of the link will equal the plural value of the model. */
    name?: string;
    /** The model for which this nav item links to. */
    model: ExtensionK8sModel;
  }
>;

/** This extension can be used to contribute a navigation item that points to a cluster resource details page.
    The K8s model of that resource can be used to define the navigation item. */
export type ResourceClusterNavItem = ExtensionDeclaration<
  'console.navigation/resource-cluster',
  NavItemProperties & {
    /** Overrides the default name. If not supplied the name of the link will equal the plural value of the model. */
    name?: string;
    /** The model for which this nav item links to. */
    model: ExtensionK8sModel;
  }
>;

/** This extension can be used to add a separator between navigation items in the navigation. */
export type Separator = ExtensionDeclaration<
  'console.navigation/separator',
  Omit<NavItemProperties, 'startsWith'>
>;

/** This extension can be used to define a new section of navigation items in the navigation tab. */
export type NavSection = ExtensionDeclaration<
  'console.navigation/section',
  Omit<NavItemProperties, 'startsWith' | 'section'> & {
    /** Name of this section. If not supplied, only a separator will be shown above the section. */
    name?: string;
  }
>;

export type ResourceNavItem = ResourceClusterNavItem | ResourceNSNavItem;

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

export const isResourceNavItem = (e: Extension): e is ResourceNavItem =>
  isResourceNSNavItem(e) || isResourceClusterNavItem(e);

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
