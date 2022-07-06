import * as React from 'react';
import { Link, LinkProps } from 'react-router-dom';

export const NavLink: React.FC<NavLinkProps> = ({ children, dragRef, ...linkProps }) => {
  return (
    <Link {...linkProps} ref={dragRef}>
      {children}
    </Link>
  );
};

export type NavLinkProps = LinkProps & {
  dragRef?: React.Ref<any>;
};
