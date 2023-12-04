import { ExtensionK8sGroupKindModel, ExtensionK8sModel } from '../api/common-types';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

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
  /** The perspective to which this page belongs to. If not specified, contributes to all perspectives. */
  perspective?: string;
  /** The component to be rendered when the route matches. */
  component: CodeRef<React.ComponentType>;
  /** Valid URL path or array of paths that `path-to-regexp@^1.7.0` understands. */
  path: string | string[];
  /** When true, will only match if the path matches the `location.pathname` exactly. */
  exact?: boolean;
};

/**
 * Adds new page to Console router.
 *
 * Under the hood we use React Router.
 * See https://v5.reactrouter.com/
 *
 * Note: This extension should not be used for resource list and details page. For adding both list and details page for a resource use the
 * [console.navigation/resource-ns](#consolenavigationresource-ns) extension, instead, which renders elementary fields.
 */
export type RoutePage = ExtensionDeclaration<'console.page/route', RoutePageProperties>;

/** Adds new resource list page to Console router. */
export type ResourceListPage = ExtensionDeclaration<
  'console.page/resource/list',
  ResourcePageProperties & {}
>;

/** Adds new resource details page to Console router. */
export type ResourceDetailsPage = ExtensionDeclaration<
  'console.page/resource/details',
  ResourcePageProperties & {}
>;

/**
 * @deprecated - Use `console.tab/horizontalNav` instead
 * Adds new resource tab page to Console router.
 */
export type ResourceTabPage = ExtensionDeclaration<
  'console.page/resource/tab',
  Omit<ResourcePageProperties, 'component'> & {
    /** The component to be rendered when the route matches. */
    component: CodeRef<React.ComponentType>;
    /** The name of the tab. */
    name: string;
    /** The optional href for the tab link. If not provided, the first `path` is used. */
    href?: string;
    /** When true, will only match if the path matches the `location.pathname` exactly. */
    exact?: boolean;
  }
>;

/**
 * Adds new standalone page (rendered outside the common page layout) to Console router.
 *
 * Under the hood we use React Router.
 * See https://v5.reactrouter.com/
 */
export type StandaloneRoutePage = ExtensionDeclaration<
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

/** @deprecated - use `console.tab/horizontalNav` */
export const isResourceTabPage = (e: Extension): e is ResourceTabPage =>
  e.type === 'console.page/resource/tab';
