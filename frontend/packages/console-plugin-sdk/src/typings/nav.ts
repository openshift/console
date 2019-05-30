import { Extension } from './extension';

import {
  NavLinkProps,
  HrefLinkProps,
  ResourceNSLinkProps,
  ResourceClusterLinkProps,
} from '@console/internal/components/nav/items';

namespace ExtensionProperties {
  interface NavItem {
    /** Perspective to which this item belongs to. */
    perspective?: string;
    /** Nav section to which this item belongs to. */
    section?: string;
    /** Props to pass to the corresponding `NavLink` component. */
    componentProps: Pick<NavLinkProps, 'name' | 'required' | 'disallowed' | 'startsWith'>;
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
    componentProps: NavItem['componentProps'] & Pick<ResourceClusterLinkProps, 'resource' | 'model'>;
  }
}

export interface HrefNavItem extends Extension<ExtensionProperties.HrefNavItem> {
  type: 'NavItem/Href';
}

export interface ResourceNSNavItem extends Extension<ExtensionProperties.ResourceNSNavItem> {
  type: 'NavItem/ResourceNS';
}

export interface ResourceClusterNavItem extends Extension<ExtensionProperties.ResourceClusterNavItem> {
  type: 'NavItem/ResourceCluster';
}

export type NavItem = HrefNavItem | ResourceNSNavItem | ResourceClusterNavItem;

export const isHrefNavItem = (e: Extension<any>): e is HrefNavItem => {
  return e.type === 'NavItem/Href';
};

export const isResourceNSNavItem = (e: Extension<any>): e is ResourceNSNavItem => {
  return e.type === 'NavItem/ResourceNS';
};

export const isResourceClusterNavItem = (e: Extension<any>): e is ResourceClusterNavItem => {
  return e.type === 'NavItem/ResourceCluster';
};

export const isNavItem = (e: Extension<any>): e is NavItem => {
  return isHrefNavItem(e) || isResourceNSNavItem(e) || isResourceClusterNavItem(e);
};
