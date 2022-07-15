import { ContextProvider as CoreContextProvider } from '@openshift/dynamic-plugin-sdk';
import { Extension } from '../types';
import { RepackageExtension } from './data-types';

/** Adds new React context provider to Console application root. */
export type ContextProvider<T = any> = RepackageExtension<
  'console.context-provider',
  CoreContextProvider
>;

// Type guards

export const isContextProvider = (e: Extension): e is ContextProvider =>
  e.type === 'console.context-provider';
