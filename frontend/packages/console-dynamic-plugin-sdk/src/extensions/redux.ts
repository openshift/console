import { ReduxReducer as CoreReduxReducer } from '@openshift/dynamic-plugin-sdk';
import { Extension, ExtensionDeclaration } from '../types';

/** Adds new reducer to Console Redux store which operates on `plugins.<scope>` substate. */
export type ReduxReducer = ExtensionDeclaration<
  'console.redux-reducer',
  CoreReduxReducer['properties']
>;

// Type guards

export const isReduxReducer = (e: Extension): e is ReduxReducer =>
  e.type === 'console.redux-reducer';
