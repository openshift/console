import * as React from 'react';
import { NavItem, NavItemSeparator } from '@patternfly/react-core';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { connect } from 'react-redux';
import { Link, LinkProps } from 'react-router-dom';
import {
  isNavItem,
  isHrefNavItem,
  isNavSection,
  isSeparator,
  NavItem as PluginNavItem,
  NavSection as PluginNavSection,
  Separator as PluginNavSeparator,
} from '@console/dynamic-plugin-sdk';
import { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
// import { stripBasePath } from '../utils';
import { RootState } from '../../../../redux';
// eslint-disable-next-line import/no-cycle
import NavSection from './NavSection';

export const ALL_NAMESPACES_KEY = '#ALL_NS#';
export const formatNamespacedRouteForResource = (resource, namespace) =>
  namespace === ALL_NAMESPACES_KEY
    ? `/k8s/all-namespaces/${resource}`
    : `/k8s/ns/${namespace}/${resource}`;

export const formatNamespacedRouteForHref = (href: string, namespace: string) =>
  namespace === ALL_NAMESPACES_KEY ? `${href}/all-namespaces` : `${href}/ns/${namespace}`;

export const matchesPath = (resourcePath, prefix) =>
  resourcePath === prefix || _.startsWith(resourcePath, `${prefix}/`);

export const stripNS = (href) => {
  // href = stripBasePath(href);
  // return href
  //   .replace(/^\/?k8s\//, '')
  //   .replace(/^\/?(cluster|all-namespaces|ns\/[^/]*)/, '')
  //   .replace(/^\//, '');
  return href;
};

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

    const itemClasses = classNames(className, { 'pf-m-current': isActive });
    const linkClasses = classNames('pf-c-nav__link', { 'pf-m-current': isActive });
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

const RootNavLinkInternal: React.FC<RootNavLinkProps & RootNavLinkStateProps> = ({
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
  { required }: RootNavLinkProps,
): RootNavLinkStateProps => ({
  canRender: required ? _.castArray(required).every((r) => state.FLAGS.get(r)) : true,
  activeNamespace: null,
  isActive: false,
});

export const RootNavLink = connect(rootNavLinkMapStateToProps)(RootNavLinkInternal);

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
          // eslint-disable-next-line react/no-array-index-key
          return <NavItemSeparator key={`separator-${index}`} />;
        }
        return <React.Fragment key={item.uid}>{createLink(item, true)}</React.Fragment>;
      })}
    </>
  );
};
