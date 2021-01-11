import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash-es';
import { referenceForModel, K8sKind } from '../../../module/k8s';
import { stripBasePath } from '../../utils';
import { ALL_NAMESPACES_KEY } from '@console/shared';

import { Link, LinkProps } from 'react-router-dom';
import { NavItem } from '@patternfly/react-core';

export const matchesPath = (resourcePath, prefix) =>
  resourcePath === prefix || _.startsWith(resourcePath, `${prefix}/`);
export const matchesModel = (resourcePath, model) =>
  model && matchesPath(resourcePath, referenceForModel(model));

export const stripClusterNS = (href) => {
  href = stripBasePath(href);
  return href
    .replace(/^\/?k8s\//, '')
    .replace(/^\/?(mc|cl\/[^/]*)/, '')
    .replace(/^\/?(cluster|all-namespaces|ns\/[^/]*)/, '')
    .replace(/^\//, '');
};
//activeCluster: state.UI.get('activeCluster'),

export const formatClusteredNamespacedRouteForResource = (resource, cluster, namespace) => {
  let res = '/k8s';

  if (cluster) {
    res += `/cl/${cluster}`;
  }

  if (namespace === ALL_NAMESPACES_KEY) {
    res += `/all-namespaces/${resource}`;
  } else {
    res += `/ns/${namespace}/${resource}`;
  }

  return res;
}

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

export class ResourceNSLink extends NavLink<ResourceNSLinkProps> {
  static isActive(props, resourcePath, activeCluster, activeNamespace) {
    const href = stripClusterNS(formatClusteredNamespacedRouteForResource(props.resource, activeCluster, activeNamespace));
    return matchesPath(resourcePath, href) || matchesModel(resourcePath, props.model);
  }

  get to() {
    const { resource, activeCluster, activeNamespace } = this.props;
    return formatClusteredNamespacedRouteForResource(resource, activeCluster, activeNamespace);
  }
}

export class ResourceClusterLink extends NavLink<ResourceClusterLinkProps> {
  static isActive(props, resourcePath) {
    return (
      resourcePath === props.resource ||
      _.startsWith(resourcePath, `${props.resource}/`) ||
      matchesModel(resourcePath, props.model)
    );
  }

  get to() {
    return this.props.activeCluster ? `/k8s/cl/${this.props.activeCluster}/cluster/${this.props.resource}` : `/k8s/cluster/${this.props.resource}`;
  }
}

export class HrefLink extends NavLink<HrefLinkProps> {
  static isActive(props, resourcePath) {
    const noNSHref = stripClusterNS(props.href);
    return resourcePath === noNSHref || _.startsWith(resourcePath, `${noNSHref}/`);
  }

  get to() {
    return this.props.activeCluster ? `/cl/${this.props.activeCluster}${this.props.href}` : this.props.href;
  }
}

export type ResourceNSLinkProps = NavLinkProps & {
  resource: string;
  model?: K8sKind;
  activeCluster?: string;
  activeNamespace?: string;
};

export type ResourceClusterLinkProps = NavLinkProps & {
  resource: string;
  model?: K8sKind;
  activeCluster?: string;
};

export type HrefLinkProps = NavLinkProps & {
  href: string;
  activeCluster?: string;
};