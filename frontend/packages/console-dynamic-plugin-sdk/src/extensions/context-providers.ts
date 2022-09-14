import { ContextProvider as CoreContextProvider } from '@openshift/dynamic-plugin-sdk';
import { Extension, ExtensionDeclaration } from '../types';

/** Adds new React context provider to Console application root. */
export type ContextProvider<T = any> = ExtensionDeclaration<
  'console.context-provider',
  CoreContextProvider['properties']
>;

// Type guards

export const isContextProvider = (e: Extension): e is ContextProvider =>
  e.type === 'console.context-provider';
