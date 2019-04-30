import { Extension } from '.';
import { K8sKind } from '@console/internal/module/k8s';

namespace ExtensionProperties {
  interface NavItem {
    // TODO(vojtech): link to existing nav sections by value
    section: 'Home' | 'Workloads';
    componentProps: {
      name: string;
      required?: string;
      disallowed?: string;
      startsWith?: string[];
    }
  }

  export interface HrefNavItem extends NavItem {
    componentProps: NavItem['componentProps'] & {
      href: string;
      activePath?: string;
    }
  }

  export interface ResourceNSNavItem extends NavItem {
    componentProps: NavItem['componentProps'] & {
      resource: string;
      model?: K8sKind;
    }
  }
}

export interface HrefNavItem extends Extension<ExtensionProperties.HrefNavItem> {
  type: 'NavItem/Href';
}

export interface ResourceNSNavItem extends Extension<ExtensionProperties.ResourceNSNavItem> {
  type: 'NavItem/ResourceNS';
}

// TODO(vojtech): add ResourceClusterNavItem
export type NavItem = HrefNavItem | ResourceNSNavItem;

export function isHrefNavItem(e: Extension<any>): e is HrefNavItem {
  return e.type === 'NavItem/Href';
}

export function isResourceNSNavItem(e: Extension<any>): e is ResourceNSNavItem {
  return e.type === 'NavItem/ResourceNS';
}

export function isNavItem(e: Extension<any>): e is NavItem {
  return isHrefNavItem(e) || isResourceNSNavItem(e);
}
