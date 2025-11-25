import { Provider } from 'react';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

/** Adds new React context provider to Console application root. */
export type ContextProvider<T = any> = ExtensionDeclaration<
  'console.context-provider',
  {
    /** Context Provider component. */
    provider: CodeRef<Provider<T>>;
    /** Hook for the Context value. */
    useValueHook: CodeRef<() => T>;
  }
>;

// Type guards

export const isContextProvider = (e: Extension): e is ContextProvider =>
  e.type === 'console.context-provider';
