import type { FC } from 'react';
import { useMemo, useCallback } from 'react';
import { NavItem } from '@patternfly/react-core';
import type { HrefNavItem } from '@console/dynamic-plugin-sdk';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import {
  formatNamespacedRouteForHref,
  formatNamespacedRouteForResource,
} from '@console/shared/src/utils/namespace';
import type { NavLinkProps } from './NavLink';
import { NavLink } from './NavLink';
import { navItemHrefIsActive, stripScopeFromPath } from './utils';

export const NavItemHref: FC<NavItemHrefProps> = ({
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
  const isActive = useMemo(() => navItemHrefIsActive(location, href, startsWith), [
    href,
    location,
    startsWith,
  ]);
  const to = useCallback(() => {
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
      <NavLink {...navLinkProps} {...dataAttributes} to={to()}>
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
