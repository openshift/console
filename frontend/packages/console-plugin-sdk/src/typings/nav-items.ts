import {
  NavLinkProps,
  HrefLinkProps,
  ResourceNSLinkProps,
  ResourceClusterLinkProps,
} from '@console/internal/components/nav/items';
import { Extension } from './common';

namespace ExtensionProperties {
  interface NavItem {
    /** Perspective id to which this item belongs to. If not specified, use the default perspective. */
    perspective?: string;
    /** Nav section to which this item belongs to. If not specified, render item as top-level link. */
    section?: string;
    /** Props to pass to the corresponding `NavLink` component. */
    componentProps: Pick<NavLinkProps, 'name' | 'startsWith'>;
    /** Nav item after which this item should be placed. */
    mergeAfter?: string;
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

export const isNavItem = (e: Extension): e is NavItem => {
  return isHrefNavItem(e) || isResourceNSNavItem(e) || isResourceClusterNavItem(e);
};
