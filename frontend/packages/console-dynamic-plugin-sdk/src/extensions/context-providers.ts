import { Provider } from 'react';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';

namespace ExtensionProperties {
  /** Adds new React context provider to Console application root. */
  export type ContextProvider = {
    /** Context Provider Exotic Component. */
    provider: EncodedCodeRef;
    /** Hook for the Context value. */
    useValueHook: EncodedCodeRef;
  };

  export type ContextProviderCodeRefs<T> = {
    provider: CodeRef<Provider<T>>;
    useValueHook: CodeRef<() => T>;
  };
}

// Extension types

export type ContextProvider = Extension<ExtensionProperties.ContextProvider> & {
  type: 'console.context-provider';
};

export type ResolvedContextProvider<R = any> = UpdateExtensionProperties<
  ContextProvider,
  ExtensionProperties.ContextProviderCodeRefs<R>
>;

// Type guards

export const isContextProvider = (e: Extension): e is ResolvedContextProvider =>
  e.type === 'console.context-provider';
