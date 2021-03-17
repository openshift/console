import { RouteComponentProps } from 'react-router';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';

namespace ExtensionProperties {
  /** Adds new standalone page (rendered outside the common page layout) to Console router. */
  export type StandaloneRoutePage = {
    /** The component to be rendered when the route matches. */
    component: EncodedCodeRef;
    /** Valid URL path or array of paths that `path-to-regexp@^1.7.0` understands. */
    path: string | string[];
    /** When true, will only match if the path matches the `location.pathname` exactly. */
    exact?: boolean;
  };

  export type StandaloneRoutePageCodeRefs = {
    component: CodeRef<React.FC<RouteComponentProps>>;
  };
}

// Extension types

export type StandaloneRoutePage = Extension<ExtensionProperties.StandaloneRoutePage> & {
  type: 'console.page/route/standalone';
};

export type ResolvedStandaloneRoutePage = UpdateExtensionProperties<
  StandaloneRoutePage,
  ExtensionProperties.StandaloneRoutePageCodeRefs
>;

// Type guards

export const isStandaloneRoutePage = (e: Extension): e is ResolvedStandaloneRoutePage =>
  e.type === 'console.page/route/standalone';
