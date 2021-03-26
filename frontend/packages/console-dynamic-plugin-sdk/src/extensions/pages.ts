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

export type ResourceListPage = ExtensionDeclaration<
  'console.page/resource/list',
  {
    /** The model for which component is related to */
    model: {
      apiGroup: string;
      apiVersion: string;
      kind: string;
    };
    component: CodeRef<React.FC<ResourcePageCommonProps>>;
  }
>;

// Type guards

export const isStandaloneRoutePage = (e: Extension): e is StandaloneRoutePage =>
  e.type === 'console.page/route/standalone';

export const isResourceListPage = (e: Extension): e is ResourceListPage =>
  e.type === 'console.page/resource/list';
