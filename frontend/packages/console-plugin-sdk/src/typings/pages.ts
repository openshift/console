import { RouteProps, RouteComponentProps } from 'react-router-dom';
import { K8sKind, K8sResourceKindReference } from '@console/internal/module/k8s';
import { Extension } from './extension';
import { LazyLoader } from './types';

namespace ExtensionProperties {
  export interface ResourcePage<T> {
    /** Model associated with the resource page. */
    model: K8sKind;
    /** Loader for the corresponding React page component. */
    loader: LazyLoader<T>;
  }

  export type ResourceListPage = ResourcePage<{
    /** See https://reacttraining.com/react-router/web/api/match */
    match: RouteComponentProps['match'];
    /** The resource kind scope. */
    kind: K8sResourceKindReference;
    /** Whether the page should assign focus when loaded. */
    autoFocus: boolean;
    /** Whether the page should mock the UI empty state. */
    mock: boolean;
    /** The namespace scope. */
    namespace: string;
  }>;

  export type ResourceDetailsPage = ResourcePage<{
    /** See https://reacttraining.com/react-router/web/api/match */
    match: RouteComponentProps['match'];
    /** The resource kind scope. */
    kind: K8sResourceKindReference;
    /** The namespace scope. */
    namespace: string;
    /** The page name. */
    name: string;
  }>;

  // Maps to react-router#https://reacttraining.com/react-router/web/api/Route
  // See https://reacttraining.com/react-router/web/api/Route
  export type RoutePage = Omit<RouteProps, 'location'> & {
    /** Loader for the corresponding React page component. */
    loader?: LazyLoader<RouteComponentProps>;
    /** Any valid URL path or array of paths that path-to-regexp@^1.7.0 understands. */
    path: string | string[];
  };
}

export interface ResourceListPage extends Extension<ExtensionProperties.ResourceListPage> {
  type: 'Page/Resource/List';
}

export interface ResourceDetailsPage extends Extension<ExtensionProperties.ResourceDetailsPage> {
  type: 'Page/Resource/Details';
}

export interface RoutePage extends Extension<ExtensionProperties.RoutePage> {
  type: 'Page/Route';
}

export type ResourcePage = ResourceListPage | ResourceDetailsPage;

export const isResourceListPage = (e: Extension<any>): e is ResourceListPage => {
  return e.type === 'Page/Resource/List';
};

export const isResourceDetailsPage = (e: Extension<any>): e is ResourceDetailsPage => {
  return e.type === 'Page/Resource/Details';
};

export const isRoutePage = (e: Extension<any>): e is RoutePage => {
  return e.type === 'Page/Route';
};
