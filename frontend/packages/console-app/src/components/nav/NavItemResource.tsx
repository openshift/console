import type { FC } from 'react';
import { useMemo, useCallback } from 'react';
import { NavItem } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import navStyles from '@patternfly/react-styles/css/components/Nav/nav';
import type { ResourceNSNavItem } from '@console/dynamic-plugin-sdk';
import { ALL_NAMESPACES_KEY } from '@console/dynamic-plugin-sdk/src/constants';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '@console/shared/src/constants/common';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils/namespace';
import type { NavLinkProps } from './NavLink';
import { NavLink } from './NavLink';
import { navItemResourceIsActive } from './utils';

export const NavItemResource: FC<NavItemResourceProps> = ({
  model,
  startsWith,
  namespaced,
  className,
  dataAttributes,
  listItem = true,
  ...navLinkProps
}) => {
  const [activeNamespace] = useActiveNamespace();
  const location = useLocation();
  const lastNamespace = sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);
  const resourceReference = referenceForExtensionModel(model);
  const [k8sModel] = useK8sModel(resourceReference);
  const isActive = useMemo(() => navItemResourceIsActive(location, k8sModel, startsWith), [
    k8sModel,
    location,
    startsWith,
  ]);
  const to = useCallback(
    () =>
      namespaced
        ? formatNamespacedRouteForResource(
            resourceReference,
            lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : activeNamespace,
          )
        : `/k8s/cluster/${resourceReference}`,
    [namespaced, resourceReference, lastNamespace, activeNamespace],
  );

  if (!listItem) {
    return (
      <div className={css(navStyles.navItem, className)}>
        <NavLink
          {...navLinkProps}
          {...dataAttributes}
          to={to()}
          className={css(navStyles.navLink, isActive && navStyles.modifiers.current)}
          aria-current={isActive ? 'page' : undefined}
        />
      </div>
    );
  }
  return (
    <NavItem className={className} isActive={isActive}>
      <NavLink {...navLinkProps} {...dataAttributes} to={to()} />
    </NavItem>
  );
};

export type NavItemResourceProps = Omit<NavLinkProps, 'to'> &
  Pick<ResourceNSNavItem['properties'], 'model' | 'startsWith' | 'dataAttributes'> & {
    namespaced: boolean;
    /** When false, renders a div instead of li for use in non-list contexts like drag-and-drop. */
    listItem?: boolean;
  };
