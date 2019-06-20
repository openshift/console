import * as React from 'react';
import { Nav, NavProps, NavList, PageSidebar } from '@patternfly/react-core';
import PerspectiveNav from './perspective-nav';
import NavHeader from './nav-header';

type NavigationProps = {
  onNavSelect: NavProps['onSelect'];
  isNavOpen: boolean;
};

export const Navigation: React.FC<NavigationProps> = React.memo(
  ({ isNavOpen, onNavSelect }) => (
    <PageSidebar
      nav={
        <Nav aria-label="Nav" onSelect={onNavSelect}>
          <NavHeader />
          <NavList>
            <PerspectiveNav />
          </NavList>
        </Nav>
      }
      isNavOpen={isNavOpen}
    />
  )
);
