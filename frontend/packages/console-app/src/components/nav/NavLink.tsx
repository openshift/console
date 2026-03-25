import type { FC, Ref, ReactNode } from 'react';
import type { LinkProps } from 'react-router';
import { Link } from 'react-router';

export const NavLink: FC<NavLinkProps> = ({ children, dragRef, ...linkProps }) => {
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
