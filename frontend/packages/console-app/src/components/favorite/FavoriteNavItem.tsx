import * as React from 'react';
import { NavItem } from '@patternfly/react-core';
import { NavLink } from 'react-router-dom';
import { ResourceNSNavItem } from '@console/dynamic-plugin-sdk';

export const FavoriteNavItem: React.FC<FavoriteNavItemProps> = ({
  className,
  dataAttributes,
  isActive,
  to,
  children,
  ...navLinkProps
}) => {
  return (
    <NavItem className={className} isActive={isActive}>
      <NavLink {...navLinkProps} {...dataAttributes} to={to} className="pf-v6-u-py-0 pf-v6-u-pr-0">
        {children}
      </NavLink>
    </NavItem>
  );
};

export type FavoriteNavItemProps = {
  to: string;
  dataAttributes?: ResourceNSNavItem['properties']['dataAttributes'];
  isActive: boolean;
  className: string;
  children?: React.ReactNode;
};
