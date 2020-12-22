import {
  NavLinkProps,
  HrefLinkProps,
  ResourceNSLinkProps,
  ResourceClusterLinkProps,
} from '@console/internal/components/nav/items';
import { Extension } from './base';

namespace ExtensionProperties {
  interface NavItem {
    /** Item id, should be unique for all items and sections */
    id: string;
    /** Perspective id to which this item belongs to. If not specified, use the default perspective. */
    perspective?: string;
    /** Nav section to which this item belongs to. If not specified, render item as top-level link. */
    section?: string;
    /** Props to pass to the corresponding `NavLink` component. */
    componentProps: Pick<
      NavLinkProps,
      'name' | 'startsWith' | 'testID' | 'data-tour-id' | 'data-quickstart-id'
    >;
    /*
     * TODO: Resolve issue of extensions adding optional sections
     * Providing insertBefore and mergeAfter capability to handles simple cases where extensions
     * could add optional sections. This only handles cases where either the prev or next nav
     * item is always there.
     */
    /** Nav item before which this item should be placed. For arrays, first one found in order is used */
    insertBefore?: string | string[];
    /** Nav item after which this item should be placed (before takes precedence). For arrays, first one found in order is used */
    insertAfter?: string | string[];
  }

  export interface SeparatorNavItem extends Omit<NavItem, 'componentProps'> {
    componentProps: {
      testID?: string;
    };
  }

  export interface HrefNavItem extends NavItem {
    componentProps: NavItem['componentProps'] & Pick<HrefLinkProps, 'href' | 'activePath'>;
  }

  export interface ResourceNSNavItem extends NavItem {
    componentProps: NavItem['componentProps'] & Pick<ResourceNSLinkProps, 'resource' | 'model'>;
  }

  export interface ResourceClusterNavItem extends NavItem {
    componentProps: NavItem['componentProps'] &
      Pick<ResourceClusterLinkProps, 'resource' | 'model'>;
  }
}

export interface SeparatorNavItem extends Extension<ExtensionProperties.SeparatorNavItem> {
  type: 'NavItem/Separator';
}

export interface HrefNavItem extends Extension<ExtensionProperties.HrefNavItem> {
  type: 'NavItem/Href';
}

export interface ResourceNSNavItem extends Extension<ExtensionProperties.ResourceNSNavItem> {
  type: 'NavItem/ResourceNS';
}

export interface ResourceClusterNavItem
  extends Extension<ExtensionProperties.ResourceClusterNavItem> {
  type: 'NavItem/ResourceCluster';
}

export type NavItem = HrefNavItem | ResourceNSNavItem | ResourceClusterNavItem;

export const isHrefNavItem = (e: Extension): e is HrefNavItem => {
  return e.type === 'NavItem/Href';
};

export const isResourceNSNavItem = (e: Extension): e is ResourceNSNavItem => {
  return e.type === 'NavItem/ResourceNS';
};

export const isResourceClusterNavItem = (e: Extension): e is ResourceClusterNavItem => {
  return e.type === 'NavItem/ResourceCluster';
};

export const isSeparatorNavItem = (e: Extension): e is SeparatorNavItem => {
  return e.type === 'NavItem/Separator';
};

export const isNavItem = (e: Extension): e is NavItem => {
  return (
    isHrefNavItem(e) ||
    isResourceNSNavItem(e) ||
    isResourceClusterNavItem(e) ||
    isSeparatorNavItem(e)
  );
};
