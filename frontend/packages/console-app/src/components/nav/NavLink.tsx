import * as React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import { useClusterPrefixedPath } from '../detect-cluster/useClusterPrefixedPath';

export const NavLink: React.FC<NavLinkProps> = ({ children, dragRef, ...linkProps }) => {
  const to = useClusterPrefixedPath(linkProps.to);
  return (
    <Link data-test="nav" ref={dragRef} {...linkProps} to={to}>
      {children}
    </Link>
  );
};

export type NavLinkProps = Omit<LinkProps, 'to'> & {
  to: string;
  dragRef?: React.Ref<any>;
};
