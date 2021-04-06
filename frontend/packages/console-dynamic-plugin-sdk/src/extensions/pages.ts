import { RouteComponentProps } from 'react-router';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { ExtensionDeclaration, CodeRef } from '../types';

/** Adds new standalone page (rendered outside the common page layout) to Console router. */
export type StandaloneRoutePage = ExtensionDeclaration<
  'console.page/route/standalone',
  {
    /** The component to be rendered when the route matches. */
    component: CodeRef<React.FC<RouteComponentProps>>;
    /** Valid URL path or array of paths that `path-to-regexp@^1.7.0` understands. */
    path: string | string[];
    /** When true, will only match if the path matches the `location.pathname` exactly. */
    exact?: boolean;
  }
>;

type ResourcePageCommonProps = {
  /** See https://reacttraining.com/react-router/web/api/match */
  match: RouteComponentProps['match'];
  /** The resource kind scope. */
  kind: string;
  /** The namespace scope. */
  namespace: string;
};

type ResourceModel = {
  model: {
    apiGroup: string;
    apiVersion: string;
    kind: string;
  };
};

export type ResourceListPage = ExtensionDeclaration<
  'console.page/resource/list',
  ResourceModel & {
    /** The model for which component is related to */
    component: CodeRef<React.FC<ResourcePageCommonProps>>;
  }
>;

export type ResourceDetailsPage = ExtensionDeclaration<
  'console.page/resource/details',
  ResourceModel & {
    component: CodeRef<
      React.FC<
        ResourcePageCommonProps & {
          /* The name of the page */
          name: string;
        }
      >
    >;
  }
>;

// Type guards

export const isStandaloneRoutePage = (e: Extension): e is StandaloneRoutePage =>
  e.type === 'console.page/route/standalone';

export const isResourceListPage = (e: Extension): e is ResourceListPage =>
  e.type === 'console.page/resource/list';

export const isResourceDetailsPage = (e: Extension): e is ResourceDetailsPage =>
  e.type === 'console.page/resource/details';
