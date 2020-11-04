import * as React from 'react';
import * as classNames from 'classnames';
import { Link, LinkProps } from 'react-router-dom';
import * as _ from 'lodash-es';
import { NavItem } from '@patternfly/react-core';
import { connect } from 'react-redux';
import {
  NavItem as PluginNavItem,
  isNavItem,
  isHrefNavItem,
  isResourceNSNavItem,
  isResourceClusterNavItem,
} from '@console/plugin-sdk';
import { formatNamespacedRouteForResource } from '@console/shared/src/utils';
import { referenceForModel, K8sKind } from '../../module/k8s';
import { stripBasePath } from '../utils';
import { featureReducerName } from '../../reducers/features';
import { RootState } from '../../redux';
import { getActiveNamespace } from '../../reducers/ui';
import { LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY } from '@console/shared/src/constants';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants/common';

export const matchesPath = (resourcePath, prefix) =>
  resourcePath === prefix || _.startsWith(resourcePath, `${prefix}/`);
export const matchesModel = (resourcePath, model) =>
  model && matchesPath(resourcePath, referenceForModel(model));

export const stripNS = (href) => {
  href = stripBasePath(href);
  return href
    .replace(/^\/?k8s\//, '')
    .replace(/^\/?(cluster|all-namespaces|ns\/[^/]*)/, '')
    .replace(/^\//, '');
};

export const ExternalLink = ({ href, name }) => (
  <NavItem isActive={false}>
    <a
      className="pf-c-nav__link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-test="nav"
    >
      {name}
      <span className="co-external-link" />
    </a>
  </NavItem>
);

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
    return _.some(someStrings, (s) => resourcePath.startsWith(s));
  }

  render() {
    const {
      isActive,
      id,
      name,
      tipText,
      onClick,
      testID,
      children,
      className,
      'data-tour-id': dataTourId,
    } = this.props;

    // onClick is now handled globally by the Nav's onSelect,
    // however onClick can still be passed if desired in certain cases

    const itemClasses = classNames(className, { 'pf-m-current': isActive });
    const linkClasses = classNames('pf-c-nav__link', { 'pf-m-current': isActive });
    return (
      <NavItem className={itemClasses} isActive={isActive}>
        <Link
          className={linkClasses}
          id={id}
          data-test-id={testID}
          to={this.to}
          onClick={onClick}
          title={tipText}
          data-tour-id={dataTourId}
          data-test="nav"
        >
          {name}
          {children}
        </Link>
      </NavItem>
    );
  }
}

export class ResourceNSLink extends NavLink<ResourceNSLinkProps> {
  static isActive(props, resourcePath, activeNamespace) {
    const href = stripNS(formatNamespacedRouteForResource(props.resource, activeNamespace));
    return matchesPath(resourcePath, href) || matchesModel(resourcePath, props.model);
  }

  get to() {
    const { resource, activeNamespace } = this.props;
    const lastNamespace = localStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);
    return formatNamespacedRouteForResource(
      resource,
      lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : activeNamespace,
    );
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
    return `/k8s/cluster/${this.props.resource}`;
  }
}

export class HrefLink extends NavLink<HrefLinkProps> {
  static isActive(props, resourcePath) {
    const noNSHref = stripNS(props.href);
    return resourcePath === noNSHref || _.startsWith(resourcePath, `${noNSHref}/`);
  }

  get to() {
    return this.props.href;
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
  'data-tour-id'?: string;
};

export type ResourceNSLinkProps = NavLinkProps & {
  resource: string;
  model?: K8sKind;
  activeNamespace?: string;
};

export type ResourceClusterLinkProps = NavLinkProps & {
  resource: string;
  model?: K8sKind;
};

export type HrefLinkProps = NavLinkProps & {
  href: string;
};

export type NavLinkComponent<T extends NavLinkProps = NavLinkProps> = React.ComponentType<T> & {
  isActive: (props: T, resourcePath: string, activeNamespace: string) => boolean;
};

export const createLink = (item: PluginNavItem, rootNavLink = false): React.ReactElement => {
  if (isNavItem(item)) {
    let Component: NavLinkComponent = null;
    if (isHrefNavItem(item)) {
      Component = HrefLink;
    }
    if (isResourceNSNavItem(item)) {
      Component = ResourceNSLink;
    }
    if (isResourceClusterNavItem(item)) {
      Component = ResourceClusterLink;
    }
    if (Component) {
      const key = item.properties.componentProps.name;
      const props = item.properties.componentProps;
      if (rootNavLink) {
        return <RootNavLink {...props} key={key} component={Component} />;
      }
      return <Component {...props} key={key} />;
    }
  }
  return undefined;
};

type RootNavLinkStateProps = {
  canRender: boolean;
  isActive: boolean;
  activeNamespace: string;
};

type RootNavLinkProps<T extends NavLinkProps = NavLinkProps> = NavLinkProps & {
  component: NavLinkComponent<T>;
};

const RootNavLink_: React.FC<RootNavLinkProps & RootNavLinkStateProps> = ({
  canRender,
  component: Component,
  isActive,
  className,
  children,
  ...props
}) => {
  if (!canRender) {
    return null;
  }
  return (
    <Component className={className} {...props} isActive={isActive}>
      {children}
    </Component>
  );
};

const rootNavLinkMapStateToProps = (
  state: RootState,
  { required, component: Component, ...props }: RootNavLinkProps,
): RootNavLinkStateProps => ({
  canRender: required ? _.castArray(required).every((r) => state[featureReducerName].get(r)) : true,
  activeNamespace: getActiveNamespace(state),
  isActive: Component.isActive(props, stripNS(state.UI.get('location')), getActiveNamespace(state)),
});

export const RootNavLink = connect(rootNavLinkMapStateToProps)(RootNavLink_);
