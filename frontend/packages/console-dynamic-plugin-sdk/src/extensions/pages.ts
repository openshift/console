import { RouteComponentProps } from 'react-router';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

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

// Type guards

export const isStandaloneRoutePage = (e: Extension): e is StandaloneRoutePage =>
  e.type === 'console.page/route/standalone';
