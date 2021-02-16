import { RouteComponentProps } from 'react-router';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';

export namespace ExtensionProperties {
  export type StandaloneRoutePage = {
    /** The component to be rendered when route matches */
    component: EncodedCodeRef;
    /** The route path to match against */
    path: string | string[];
    /** Defines whether the path must be an exact match */
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
