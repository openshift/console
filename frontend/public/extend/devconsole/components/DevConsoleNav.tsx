/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { connect } from 'react-redux';
import { Nav, NavList, PageSidebar } from '@patternfly/react-core';
import { HrefLink, NavSection } from '../../../components/nav';

interface DevConsoleNavigationProps {
  isNavOpen: boolean;
  location: string;
  onNavSelect: () => void;
  onToggle: () => void;
}

const DevNavSection = NavSection as React.ComponentClass<any>;

export const PageNav = (props: DevConsoleNavigationProps) => {
  const isActive = (path: string) => {
    return props.location.endsWith(path);
  };

  return (
    <Nav aria-label="Nav" onSelect={props.onNavSelect} onToggle={props.onToggle}>
      <NavList>
        <HrefLink
          href="/devops"
          name="Home"
          activePath="/devops"
          isActive={isActive('/devops')}
        />
        <HrefLink
          href="/devops/codebases"
          name="Codebases"
          activePath="/devops/codebases"
          isActive={isActive('/codebases')}
        />
        <HrefLink
          href="/devops/import"
          name="Import"
          activePath="/devops/import"
          isActive={isActive('/import')}
        />
        <HrefLink
          href="/devops/topology"
          name="Topology"
          activePath="/devops/topology"
          isActive={isActive('/topology')}
        />
        <DevNavSection title="Menu Item">
          <HrefLink
            href="/devops/submenu_1"
            name="Sub Menu 1"
            activePath="/devops/submenu_1/"
          />
          <HrefLink
            href="/devops/submenu_2"
            name="Sub Menu 2"
            activePath="/devops/submenu_2/"
          />
        </DevNavSection>
      </NavList>
    </Nav>
  );
};

export const DevConsoleNavigation: React.FunctionComponent<DevConsoleNavigationProps> = (
  props: DevConsoleNavigationProps,
) => {
  return <PageSidebar nav={<PageNav {...props} />} isNavOpen={props.isNavOpen} />;
};

const mapStateToProps = (state) => {
  return {
    location: state.UI.get('location'),
  };
};

export default connect(mapStateToProps)(DevConsoleNavigation);
