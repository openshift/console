import * as React from 'react';
import { NavLink, NavLinkProps } from './NavLink';
import { navItemResourceIsActive } from './utils';
import {
  formatNamespacedRouteForResource,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  ALL_NAMESPACES_KEY,
} from '@console/shared';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { useActiveNamespace } from '@console/dynamic-plugin-sdk/src/lib-internal';
import { useLocation } from '@console/shared/src/hooks/useLocation';
import { ResourceNSNavItem } from '@console/dynamic-plugin-sdk';
import { NavItem } from '@patternfly/react-core';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';

export const NavItemResource: React.FC<NavItemResourceProps> = ({
  model,
  startsWith,
  namespaced,
  className,
  dataAttributes,
  ...navLinkProps
}) => {
  const [activeNamespace] = useActiveNamespace();
  const location = useLocation();
  const lastNamespace = sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);
  const resourceReference = referenceForExtensionModel(model);
  const [k8sModel] = useK8sModel(resourceReference);
  const isActive = React.useMemo(() => navItemResourceIsActive(location, k8sModel, startsWith), [
    k8sModel,
    location,
    startsWith,
  ]);
  const to = React.useCallback(
    () =>
      namespaced
        ? formatNamespacedRouteForResource(
            resourceReference,
            lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : activeNamespace,
          )
        : `/k8s/cluster/${resourceReference}`,
    [namespaced, resourceReference, lastNamespace, activeNamespace],
  );
  return (
    <NavItem className={className} isActive={isActive}>
      <NavLink {...navLinkProps} {...dataAttributes} to={to} />
    </NavItem>
  );
};

export type NavItemResourceProps = Omit<NavLinkProps, 'to'> &
  Pick<ResourceNSNavItem['properties'], 'model' | 'startsWith' | 'dataAttributes'> & {
    namespaced: boolean;
  };
