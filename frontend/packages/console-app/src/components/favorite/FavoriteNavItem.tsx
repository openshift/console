import * as React from 'react';
import { NavItem } from '@patternfly/react-core';
import { NavLink } from 'react-router-dom';
import { ResourceNSNavItem } from '@console/dynamic-plugin-sdk';

export const FavoriteNavItem: React.FC<FavoriteNavItemProps> = ({
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

export type FavoriteNavItemProps = {
  to: string;
  dataAttributes?: ResourceNSNavItem['properties']['dataAttributes'];
  isActive: boolean;
  className: string;
};
