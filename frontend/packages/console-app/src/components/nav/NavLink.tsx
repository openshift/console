import type { Ref, ReactNode } from 'react';
import { Link, LinkProps } from 'react-router-dom-v5-compat';

export const NavLink: Snail.FCC<NavLinkProps> = ({ children, dragRef, ...linkProps }) => {
  return (
    <Link data-test="nav" ref={dragRef} {...linkProps}>
      {children}
    </Link>
  );
};

export type NavLinkProps = LinkProps & {
  dragRef?: Ref<any>;
  children?: ReactNode;
};
