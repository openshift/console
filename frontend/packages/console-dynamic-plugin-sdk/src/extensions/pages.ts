import type { ExtensionK8sGroupKindModel, ExtensionK8sModel } from '../api/common-types';
import type { Extension, CodeRef } from '../types';

type ResourcePageProperties = {
  /** The model for which this resource page links to. */
  model: ExtensionK8sGroupKindModel;
  /** The component to be rendered when the route matches. */
  component: CodeRef<
    React.ComponentType<{
      /** The namespace for which this resource page links to. */
      namespace: string;
      /** The model for which this resource page links to. */
      model: ExtensionK8sModel;
    }>
  >;
};

type RoutePageProperties = {
  /** The perspective this page belongs to. If not specified, applies to all perspectives. */
  perspective?: string;
  /** The component to be rendered when the route matches. */
  component: CodeRef<React.ComponentType>;
  /** Valid URL path or array of paths. Note that React Router v7 does not use `path-to-regexp`. */
  path: string | string[];
  /** When `true`, the path must match the URL exactly. */
  exact?: boolean;
};

/**
 * Adds a new page to the Console router.
 *
 * Console application uses [React Router v7](https://reactrouter.com/).
 *
 * Note that React Router v7 no longer supports passing a string array to the Route `path` prop.
 * Console retains this functionality by rendering multiple Route instances. To ensure the route
 * matches the correct paths, consider using `exact: true` and sorting your Route path values
 * from most specific to least specific.
 *
 * Also note that React Router v7 no longer supports Route `exact` prop, i.e. paths are matched
 * as `exact: true` by default. Console retains the original behavior for backwards compatibility.
 * Use `exact: true` unless you want to match more of the URL.
 *
 * Do not use this extension for resource list and details pages. To add a list or details page
 * for a resource, use the `console.navigation/resource-ns` extension instead.
 */
export type RoutePage = Extension<'console.page/route', RoutePageProperties>;

/**
 * Adds a new resource list page to Console router.
 */
export type ResourceListPage = Extension<'console.page/resource/list', ResourcePageProperties & {}>;

/**
 * Adds a new resource details page to Console router.
 */
export type ResourceDetailsPage = Extension<
  'console.page/resource/details',
  ResourcePageProperties & {}
>;

/**
 * Adds a new standalone page rendered outside the common Console page layout.
 *
 * Console application uses [React Router v7](https://reactrouter.com/).
 */
export type StandaloneRoutePage = Extension<
  'console.page/route/standalone',
  Omit<RoutePageProperties, 'perspective'>
>;

// Type guards

export const isRoutePage = (e: Extension): e is RoutePage => e.type === 'console.page/route';

export const isStandaloneRoutePage = (e: Extension): e is StandaloneRoutePage =>
  e.type === 'console.page/route/standalone';

export const isResourceListPage = (e: Extension): e is ResourceListPage =>
  e.type === 'console.page/resource/list';

export const isResourceDetailsPage = (e: Extension): e is ResourceDetailsPage =>
  e.type === 'console.page/resource/details';
