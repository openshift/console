import * as React from 'react';
import { NavItem } from '@patternfly/react-core';
import { NavLink } from 'react-router-dom';
import { ResourceNSNavItem } from '@console/dynamic-plugin-sdk';

export const FavoriteNavItemResource: React.FC<FavoriteNavItemResourceProps> = ({
  className,
  dataAttributes,
  isActive,
  to,
  ...navLinkProps
}) => {
  return (
    <NavItem className={className} isActive={isActive}>
      <NavLink {...navLinkProps} {...dataAttributes} to={to} />
    </NavItem>
  );
};

export type FavoriteNavItemResourceProps = {
  to: string;
  dataAttributes?: ResourceNSNavItem['properties']['dataAttributes'];
  isActive: boolean;
  className: string;
};
