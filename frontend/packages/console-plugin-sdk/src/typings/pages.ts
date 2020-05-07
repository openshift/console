import { RouteComponentProps, RouteProps } from 'react-router-dom';
import {
  K8sKind,
  K8sResourceKindReference,
  K8sResourceKind,
  K8sResourceCommon,
} from '@console/internal/module/k8s';
import { Extension, LazyLoader } from './base';
import { PageComponentProps } from '@console/internal/components/utils';

namespace ExtensionProperties {
  export interface ResourcePage<T> {
    /** Model associated with the resource page. */
    model: K8sKind;
    /** Loader for the corresponding React page component. */
    loader: LazyLoader<T>;
  }

  /** To add an additonal page to public components(ex: PVs, PVCs) via plugins */
  export type ResourceTabPage<R extends K8sResourceCommon> = ResourcePage<PageComponentProps<R>> & {
    /** The href for the resource page */
    href: string;
    /** Name of the resource tab inside detailsPage  */
    name: string;
  };

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
  }> & {
    /** Some Resources require ReferenceFor instead of ReferenceForModel */
    modelParser?: (obj: K8sResourceKind) => string;
  };

  export type ResourceDetailsPage = ResourcePage<{
    /** See https://reacttraining.com/react-router/web/api/match */
    match: RouteComponentProps['match'];
    /** The resource kind scope. */
    kind: K8sResourceKindReference;
    /** The namespace scope. */
    namespace: string;
    /** The page name. */
    name: string;
  }> & {
    /** Some Resources require ReferenceFor instead of ReferenceForModel */
    modelParser?: (obj: K8sResourceKind) => string;
  };

  // Maps to react-router#https://reacttraining.com/react-router/web/api/Route
  // See https://reacttraining.com/react-router/web/api/Route
  export type RoutePage = Omit<RouteProps, 'location'> & {
    /** Loader for the corresponding React page component. */
    loader?: LazyLoader<RouteComponentProps>;
    /** Any valid URL path or array of paths that path-to-regexp@^1.7.0 understands. */
    path: string | string[];
    /** Perspective id to which this page belongs to. */
    perspective?: string;
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

export interface ResourceTabPage<R extends K8sResourceCommon = K8sResourceCommon>
  extends Extension<ExtensionProperties.ResourceTabPage<R>> {
  type: 'Page/Resource/Tab';
}

export type ResourcePage = ResourceListPage | ResourceDetailsPage;

export const isResourceListPage = (e: Extension): e is ResourceListPage => {
  return e.type === 'Page/Resource/List';
};

export const isResourceDetailsPage = (e: Extension): e is ResourceDetailsPage => {
  return e.type === 'Page/Resource/Details';
};

export const isResourceTabPage = (e: Extension): e is ResourceTabPage => {
  return e.type === 'Page/Resource/Tab';
};

export const isRoutePage = (e: Extension): e is RoutePage => {
  return e.type === 'Page/Route';
};
