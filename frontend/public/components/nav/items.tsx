import * as React from 'react';
import classnames from 'classnames';
/* eslint-disable import/named */
import { Link, LinkProps } from 'react-router-dom';
import * as _ from 'lodash-es';
import { NavItem, NavItemSeparator } from '@patternfly/react-core';
import { connect } from 'react-redux';
import {
  isNavItem,
  isHrefNavItem,
  isNavSection,
  isResourceNSNavItem,
  isResourceClusterNavItem,
  isSeparator,
  NavItem as PluginNavItem,
  NavSection as PluginNavSection,
  Separator as PluginNavSeparator,
} from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { NavSection } from './section';
import {
  formatNamespacedRouteForResource,
  formatNamespacedRouteForHref,
} from '@console/shared/src/utils';
import { ExtensionK8sModel } from '@console/dynamic-plugin-sdk/src/api/common-types';
import { referenceForModel, referenceForExtensionModel } from '../../module/k8s';
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
export const matchesExtensionModel = (resourcePath, model) =>
  model && matchesPath(resourcePath, referenceForExtensionModel(model));

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
      name,
      tipText,
      onClick,
      testID,
      children,
      className,
      dataAttributes,
      'data-tour-id': dataTourId,
      'data-quickstart-id': dataQuickStartId,
    } = this.props;

    // onClick is now handled globally by the Nav's onSelect,
    // however onClick can still be passed if desired in certain cases

    const itemClasses = classnames(className, { 'pf-m-current': isActive });
    const linkClasses = classnames('pf-c-nav__link', { 'pf-m-current': isActive });
    return (
      <NavItem className={itemClasses} isActive={isActive}>
        <Link
          className={linkClasses}
          data-test-id={testID}
          to={this.to}
          onClick={onClick}
          title={tipText}
          data-tour-id={dataTourId}
          data-quickstart-id={dataQuickStartId}
          data-test="nav"
          {...dataAttributes}
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
    if (props.model) {
      return matchesExtensionModel(resourcePath, props.model);
    }
    const href = stripNS(formatNamespacedRouteForResource(props.resource, activeNamespace));
    return matchesPath(resourcePath, href);
  }

  get to() {
    const { resource, activeNamespace, model } = this.props;
    const lastNamespace = sessionStorage.getItem(LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);

    if (model) {
      return formatNamespacedRouteForResource(
        referenceForExtensionModel(model),
        lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : activeNamespace,
      );
    }
    return formatNamespacedRouteForResource(
      resource,
      lastNamespace === ALL_NAMESPACES_KEY ? lastNamespace : activeNamespace,
    );
  }
}

export class ResourceClusterLink extends NavLink<ResourceClusterLinkProps> {
  static isActive(props, resourcePath) {
    if (props.model) {
      return (
        resourcePath === `/k8s/cluster/${referenceForExtensionModel(props.model)}` ||
        _.startsWith(resourcePath, `/k8s/cluster/${referenceForExtensionModel(props.model)}`) ||
        matchesExtensionModel(resourcePath, props.model)
      );
    }
    return (
      resourcePath === props.resource ||
      _.startsWith(resourcePath, `${props.resource}/`) ||
      matchesModel(resourcePath, props.model)
    );
  }

  get to() {
    const { model } = this.props;
    if (model) {
      return `/k8s/cluster/${referenceForExtensionModel(model)}`;
    }
    return `/k8s/cluster/${this.props.resource}`;
  }
}

export class HrefLink extends NavLink<HrefLinkProps> {
  static isActive(props, resourcePath) {
    const noNSHref = stripNS(props.href);
    return resourcePath === noNSHref || _.startsWith(resourcePath, `${noNSHref}/`);
  }

  get to() {
    const { href, namespaced, prefixNamespaced, activeNamespace } = this.props;
    if (namespaced) {
      return formatNamespacedRouteForHref(href, activeNamespace);
    }
    if (prefixNamespaced) {
      return formatNamespacedRouteForResource(stripNS(href), activeNamespace);
    }
    return href;
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
  dataAttributes?: { [key: string]: string };
  'data-tour-id'?: string;
  'data-quickstart-id'?: string;
};

export type ResourceNSLinkProps = NavLinkProps & {
  resource: string;
  model?: ExtensionK8sModel;
  activeNamespace?: string;
};

export type ResourceClusterLinkProps = NavLinkProps & {
  resource: string;
  model?: ExtensionK8sModel;
};

export type HrefLinkProps = NavLinkProps & {
  href: string;
  namespaced?: boolean;
  prefixNamespaced?: string;
  activeNamespace?: string;
};

export type NavLinkComponent<T extends NavLinkProps = NavLinkProps> = React.ComponentType<T> & {
  isActive: (props: T, resourcePath: string, activeNamespace: string) => boolean;
};

export const createLink = (
  item: LoadedExtension<PluginNavItem>,
  rootNavLink = false,
): React.ReactElement => {
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
      const { id, name, ...props } = item.properties;
      if (rootNavLink) {
        return <RootNavLink name={name} id={id} key={item.uid} component={Component} {...props} />;
      }
      return <Component name={name} id={id} key={item.uid} {...props} />;
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

export type PluginNavItemsProps = {
  items: LoadedExtension<PluginNavSection | PluginNavItem | PluginNavSeparator>[];
};

export const PluginNavItems: React.FC<PluginNavItemsProps> = ({ items }) => {
  return (
    <>
      {items.map((item, index) => {
        if (isNavSection(item)) {
          const { id, name } = item.properties;
          return <NavSection id={id} title={name} key={id} isGrouped={!name} />;
        }
        if (isSeparator(item)) {
          return <NavItemSeparator key={`separator-${index}`} />;
        }
        return <div key={item.uid}>{createLink(item, true)}</div>;
      })}
    </>
  );
};
