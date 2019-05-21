import * as React from 'react';
import { Link, LinkProps } from 'react-router-dom';
import * as _ from 'lodash-es';
import { NavItem } from '@patternfly/react-core';

import { formatNamespacedRouteForResource } from '../../actions/ui';
import { referenceForModel, K8sKind } from '../../module/k8s';
import { stripBasePath } from '../utils';

export const matchesPath = (resourcePath, prefix) => resourcePath === prefix || _.startsWith(resourcePath, `${prefix}/`);
export const matchesModel = (resourcePath, model) => model && matchesPath(resourcePath, referenceForModel(model));

export const stripNS = href => {
  href = stripBasePath(href);
  return href.replace(/^\/?k8s\//, '').replace(/^\/?(cluster|all-namespaces|ns\/[^/]*)/, '').replace(/^\//, '');
};

export const ExternalLink = ({href, name}) => <NavItem isActive={false}>
  <a className="pf-c-nav__link" href={href} target="_blank" rel="noopener noreferrer">{name}<span className="co-external-link"></span></a>
</NavItem>;

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
    const { isActive, id, name, onClick } = this.props;

    // onClick is now handled globally by the Nav's onSelect,
    // however onClick can still be passed if desired in certain cases

    return (
      <NavItem isActive={isActive}>
        <Link
          id={id}
          to={this.to}
          onClick={onClick}
        >
          {name}
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
    return formatNamespacedRouteForResource(resource, activeNamespace);
  }
}

export class ResourceClusterLink extends NavLink<ResourceClusterLinkProps> {
  static isActive(props, resourcePath) {
    return resourcePath === props.resource || _.startsWith(resourcePath, `${props.resource}/`) || matchesModel(resourcePath, props.model);
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
  onClick?: LinkProps['onClick'];
  isActive?: boolean;
  required?: string | string[];
  disallowed?: string;
  startsWith?: string[];
  activePath?: string;
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
