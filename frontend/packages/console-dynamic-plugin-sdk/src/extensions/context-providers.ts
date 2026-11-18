import type { Provider } from 'react';
import type { Extension, CodeRef } from '../types';

/**
 * Adds a new React context provider to Console application root.
 *
 * Warning: This extension wraps around the entire Console shell. Adding
 * or removing context providers via feature flags causes the entire application
 * to re-render, which can cause loss of state in components. Use with caution.
 */
export type ContextProvider<T = any> = Extension<
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
