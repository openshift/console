/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { Modal } from '@patternfly/react-core';
import { NavLink } from 'react-router-dom';
import './PerspectiveSwitcher.scss';

export interface PerspectiveSwitcherProps {
  isNavOpen: boolean,
  onNavToggle: (MouseEvent) => void,
}

const PerspectiveSwitcher: React.SFC<PerspectiveSwitcherProps> = (props: PerspectiveSwitcherProps) => (
  <Modal
    isLarge
    title="Switcher Menu"
    isOpen={props.isNavOpen}
    onClose={props.onNavToggle}
    className="devops-perspective-switcher">
    <ul>
      <li>
        <NavLink
          to="/devops"
          onClick={props.onNavToggle}
          activeClassName="devops-perspective-switcher__active-link"
        >
          DevOps Console
        </NavLink>
      </li>
      <li>
        <NavLink
          to="/k8s/cluster/projects"
          onClick={props.onNavToggle}
          isActive={(match, { pathname }):boolean => !pathname.startsWith('/devops')}
          activeClassName="devops-perspective-switcher__active-link"
        >
          Admin Console
        </NavLink>
      </li>
    </ul>
  </Modal>
);

export default PerspectiveSwitcher;
