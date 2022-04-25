import * as _ from 'lodash';
import { NavLink, NavLinkProps } from './NavLink';
import { stripNS } from './utils';
import { formatNamespacedRouteForHref, formatNamespacedRouteForResource } from '@console/shared';

// TODO [tech debt] Refactor to get rid of inheritance and implement as function component.
export class NavLinkHref extends NavLink<NavLinkHrefProps> {
  static isActive(props, resourcePath) {
    const noNSHref = stripNS(props.href);
    return resourcePath === noNSHref || _.startsWith(resourcePath, `${noNSHref}/`);
  }

  get to() {
    const { href, namespaced, prefixNamespaced, activeNamespace } = this.props;
    if (namespaced) {
      return formatNamespacedRouteForHref(href, activeNamespace);
    }
    if (prefixNamespaced) {
      return formatNamespacedRouteForResource(stripNS(href), activeNamespace);
    }
    return href;
  }
}

export type NavLinkHrefProps = NavLinkProps & {
  href: string;
  namespaced?: boolean;
  prefixNamespaced?: string;
  activeNamespace?: string;
};
