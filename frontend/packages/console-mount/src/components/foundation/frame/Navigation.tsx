import * as React from 'react';
import { Nav, PageSidebar } from '@patternfly/react-core';
import PerspectiveNav from './navigation/PerspectiveNav';
import PerspectiveSwitcher from './navigation/PerspectiveSwitcher';

type NavigationProps = {
  navOpen: boolean;
};

const Navigation: React.FC<NavigationProps> = ({ navOpen }) => {
  return (
    <PageSidebar
      nav={
        <Nav>
          <PerspectiveSwitcher />
          <PerspectiveNav />
        </Nav>
      }
      isNavOpen={navOpen}
    />
  );
};

export default Navigation;
