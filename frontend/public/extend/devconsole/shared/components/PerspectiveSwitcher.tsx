/* eslint-disable no-unused-vars, no-undef */
import * as React from 'react';
import { Modal } from '@patternfly/react-core';
import { NavLink } from 'react-router-dom';
import './PerspectiveSwitcher.scss';
import * as openshiftIconImg from '../../../../imgs/openshift-favicon.png';

export interface PerspectiveSwitcherProps {
  isNavOpen: boolean,
  onNavToggle: (MouseEvent) => void,
}

const PerspectiveSwitcher: React.SFC<PerspectiveSwitcherProps> = (props: PerspectiveSwitcherProps) => (
  <Modal
    isLarge
    title=""
    isOpen={props.isNavOpen}
    onClose={props.onNavToggle}
    className="devops-perspective-switcher">
    <nav className="pf-c-nav">
      <ul className="pf-c-nav__simple-list">
        <li className="pf-c-nav__item">
          <NavLink
            to="/devops"
            onClick={props.onNavToggle}
            className="pf-c-nav__link"
            activeClassName="pf-m-current"
          >
          <img src={openshiftIconImg} alt="DevOps Console" className="devops-perspective-switcher__openshift-logo"/>  DevOps Console
          </NavLink>
        </li>
        <li className="pf-c-nav__item">
          <NavLink
            to="/k8s/cluster/projects"
            onClick={props.onNavToggle}
            className="pf-c-nav__link"
            isActive={(match, { pathname }):boolean => !pathname.startsWith('/devops')}
            activeClassName="pf-m-current"
          >
            <img src={openshiftIconImg} alt="Admin Console" className="devops-perspective-switcher__openshift-logo"/> Admin Console
          </NavLink>
        </li>
      </ul>
    </nav>
  </Modal>
);

export default PerspectiveSwitcher;
