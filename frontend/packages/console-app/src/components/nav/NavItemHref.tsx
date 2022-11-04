import * as React from 'react';
import { NavItem } from '@patternfly/react-core';
import { HrefNavItem } from '@console/dynamic-plugin-sdk';
import { useActiveNamespace } from '@console/dynamic-plugin-sdk/src/lib-internal';
import { formatNamespacedRouteForHref, formatNamespacedRouteForResource } from '@console/shared';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import { stripScopeFromPath } from '@console/shared/src/utils/paths';
import { NavLinkProps, NavLink } from './NavLink';
import { navItemHrefIsActive } from './utils';

export const NavItemHref: React.FC<NavItemHrefProps> = ({
  children,
  href,
  namespaced,
  prefixNamespaced,
  startsWith,
  dataAttributes,
  ...navLinkProps
}) => {
  const [activeNamespace] = useActiveNamespace();
  const location = useLocation();
  const isActive = React.useMemo(() => navItemHrefIsActive(location, href, startsWith), [
    href,
    location,
    startsWith,
  ]);
  const to = React.useMemo(() => {
    if (namespaced) {
      return formatNamespacedRouteForHref(href, activeNamespace);
    }
    if (prefixNamespaced) {
      return formatNamespacedRouteForResource(stripScopeFromPath(href), activeNamespace);
    }
    return href;
  }, [activeNamespace, href, namespaced, prefixNamespaced]);
  return (
    <NavItem isActive={isActive}>
      <NavLink {...navLinkProps} {...dataAttributes} to={to}>
        {children}
      </NavLink>
    </NavItem>
  );
};

export type NavItemHrefProps = Omit<NavLinkProps, 'to'> &
  Pick<
    HrefNavItem['properties'],
    'href' | 'namespaced' | 'prefixNamespaced' | 'startsWith' | 'dataAttributes'
  >;
