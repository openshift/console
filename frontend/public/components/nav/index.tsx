import * as React from 'react';
import { Nav, NavProps, PageSidebar } from '@patternfly/react-core';
import PerspectiveNav from './perspective-nav';
import NavHeader from './nav-header';

type NavigationProps = {
  onNavSelect: NavProps['onSelect'];
  onPerspectiveSelected: () => void;
  isNavOpen: boolean;
};

export const Navigation: React.FC<NavigationProps> = React.memo(
  ({ isNavOpen, onNavSelect, onPerspectiveSelected }) => (
    <PageSidebar
      nav={
        <Nav aria-label="Nav" onSelect={onNavSelect} theme="dark">
          <NavHeader onPerspectiveSelected={onPerspectiveSelected} />
          <PerspectiveNav />
        </Nav>
      }
      isNavOpen={isNavOpen}
      theme="dark"
    />
  ),
);
