import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';

import { Link, LinkProps } from 'react-router-dom';
import { NavItem } from '@patternfly/react-core';

class NavLink<P extends NavLinkProps> extends React.PureComponent<P> {
  static defaultProps = {
    required: '',
    disallowed: '',
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
  static isActive(...args): boolean {
    throw new Error('not implemented');
  }

  get to(): string {
    throw new Error('not implemented');
  }

  static startsWith(resourcePath: string, someStrings: string[]) {
    return _.some(someStrings, s => resourcePath.startsWith(s));
  }

  render() {
    const { isActive, id, name, tipText, onClick, testID, children, className } = this.props;

    // onClick is now handled globally by the Nav's onSelect,
    // however onClick can still be passed if desired in certain cases

    const itemClasses = classNames(className, { 'pf-m-current': isActive });
    const linkClasses = classNames('pf-c-nav__link', { 'pf-m-current': isActive });
    return (
      <NavItem className={itemClasses} isActive={isActive}>
        <Link className={linkClasses} id={id} data-test-id={testID} to={this.to} onClick={onClick} title={tipText}>
          {name}
          {children}
        </Link>
      </NavItem>
    );
  }
}

export type NavLinkProps = {
  name: string;
  id?: LinkProps['id'];
  className?: string;
  onClick?: LinkProps['onClick'];
  isActive?: boolean;
  required?: string | string[];
  disallowed?: string;
  startsWith?: string[];
  activePath?: string;
  tipText?: string;
  testID?: string;
};

export class AuthAdminLink extends NavLink<AuthAdminLinkProps> {
  static isActive(props, resourcePath) {
    return false;
  }

  render() {
    const { name, resource } = this.props;
    let { KeycloakAuthURL = null, KeycloakRealm = null } = { ...window.SERVER_FLAGS };
    const onClick = () => {
      window.open(`${KeycloakAuthURL}/admin/${KeycloakRealm}/console/#/realms/${KeycloakRealm}/${resource}`);
    };

    return (
      <li className={classNames('pf-c-nav__item', { active: AuthAdminLink.isActive, 'co-m-nav-link__external': true })}>
        <div onClick={onClick} className={classNames('pf-c-nav__link pf-c-nav__link', { 'co-external-link': true })}>
          {name}
        </div>
      </li>
    );
  }
}

type AuthAdminLinkProps = {
  name: string;
  resource: string;
  startsWith?: string[];
};
