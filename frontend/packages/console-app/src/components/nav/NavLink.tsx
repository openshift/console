import * as React from 'react';
import type { ReactNode } from 'react';
import { Link, LinkProps } from 'react-router-dom-v5-compat';

export const NavLink: React.FCC<NavLinkProps> = ({ children, dragRef, ...linkProps }) => {
  return (
    <Link data-test="nav" ref={dragRef} {...linkProps}>
      {children}
    </Link>
  );
};

export type NavLinkProps = LinkProps & {
  dragRef?: React.Ref<any>;
  children?: ReactNode;
};
