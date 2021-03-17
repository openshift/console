import { Extension } from '@console/plugin-sdk/src/typings/base';

namespace ExtensionProperties {
  export type NavItem = {
    /** A unique identifier for this item. */
    id: string;
    /** The perspective ID to which this item belongs to. If not specified, contributes to the default perspective. */
    perspective?: string;
    /** Navigation section to which this item belongs to. If not specified, render this item as a top level link. */
    section?: string;
    /** Adds `data-` attributes to the DOM. Each key will receive the `data-` prefix. */
    dataAttributes?: { [key: string]: string };
    /** Mark this item as active when the URL starts with one of these paths. */
    startsWith?: string[];
    /** Insert this item before the item referenced here. For arrays, the first one found in order is used. */
    insertBefore?: string | string[];
    /** Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. */
    insertAfter?: string | string[];
  };
  export type Separator = Omit<NavItem, 'startsWith'>;
  export type HrefNavItem = NavItem & {
    /** The name of this item. */
    name: string;
    /** The link href value. */
    href: string;
  };
  export type ResourceNSNavItem = NavItem & {
    /** Overrides the default name. If not supplied the name of the link will equal the plural value of the model. */
    name?: string;
    /** The model for which this nav item links to. */
    model: {
      group: string;
      version: string;
      kind: string;
    };
  };
  export type ResourceClusterNavItem = NavItem & {
    /** Overrides the default name. If not supplied the name of the link will equal the plural value of the model. */
    name?: string;
    /** The model for which this nav item links to. */
    model: {
      group: string;
      version: string;
      kind: string;
    };
  };
  export type NavSection = Omit<NavItem, 'startsWith' | 'section'> & {
    /** Name of this section. If not supplied, only a separator will be shown above the section. */
    name?: string;
  };
}

// Extension types

export type Separator = Extension<ExtensionProperties.Separator> & {
  type: 'console.navigation/separator';
};
export type HrefNavItem = Extension<ExtensionProperties.HrefNavItem> & {
  type: 'console.navigation/href';
};
export type ResourceNSNavItem = Extension<ExtensionProperties.ResourceNSNavItem> & {
  type: 'console.navigation/resource-ns';
};
export type ResourceClusterNavItem = Extension<ExtensionProperties.ResourceClusterNavItem> & {
  type: 'console.navigation/resource-cluster-ns';
};
export type NavSection = Extension<ExtensionProperties.HrefNavItem> & {
  type: 'console.navigation/section';
};

// Type guards

export const isSeparator = (e: Extension): e is Separator =>
  e.type === 'console.navigation/separator';
export const isHrefNavItem = (e: Extension): e is HrefNavItem =>
  e.type === 'console.navigation/href';
export const isResourceNSNavItem = (e: Extension): e is ResourceNSNavItem =>
  e.type === 'console.navigation/resource-ns';
export const isResourceClusterNavItem = (e: Extension): e is ResourceClusterNavItem =>
  e.type === 'console.navigation/resource-cluster';
export const isNavSection = (e: Extension): e is NavSection =>
  e.type === 'console.navigation/section';
