import { RouteComponentProps } from 'react-router';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';
import { ExtensionsK8sKind } from '../utils/common';

namespace ExtensionProperties {
  /** Adds a page for Resource, be it List/Details/Tab */
  export type ResourcePage = {
    /** Model associated with the resource page. */
    model: ExtensionsK8sKind;
    /** The component that is Associated with the resource */
    component: EncodedCodeRef;
  };

  /** Adds new standalone page (rendered outside the common page layout) to Console router. */
  export type StandaloneRoutePage = {
    /** The component to be rendered when the route matches. */
    component: EncodedCodeRef;
    /** Valid URL path or array of paths that `path-to-regexp@^1.7.0` understands. */
    path: string | string[];
    /** When true, will only match if the path matches the `location.pathname` exactly. */
    exact?: boolean;
  };

  type ResourcePageCommon<T> = CodeRef<React.FC<T>>;
  type ResourcePageCommonProps = {
    /** See https://reacttraining.com/react-router/web/api/match */
    match: RouteComponentProps['match'];
    /** The resource kind scope. */
    kind: string;
    /** The namespace scope. */
    namespace: string;
  };

  export type ResourceListPageCodeRefs = {
    component: ResourcePageCommon<ResourcePageCommonProps>;
  };

  export type StandaloneRoutePageCodeRefs = {
    component: CodeRef<React.FC<RouteComponentProps>>;
  };
}

// Extension types

export type StandaloneRoutePage = Extension<ExtensionProperties.StandaloneRoutePage> & {
  type: 'console.page/route/standalone';
};

export type ResourceListPage = Extension<ExtensionProperties.ResourcePage> & {
  type: 'console.page/resource/list';
};

export type ResolvedStandaloneRoutePage = UpdateExtensionProperties<
  StandaloneRoutePage,
  ExtensionProperties.StandaloneRoutePageCodeRefs
>;

export type ResolvedResourceListPage = UpdateExtensionProperties<
  ResourceListPage,
  ExtensionProperties.ResourceListPageCodeRefs
>;

// Type guards

export const isStandaloneRoutePage = (e: Extension): e is ResolvedStandaloneRoutePage =>
  e.type === 'console.page/route/standalone';

export const isResourceListPage = (e: Extension): e is ResolvedResourceListPage =>
  e.type === 'console.page/resource/list';
