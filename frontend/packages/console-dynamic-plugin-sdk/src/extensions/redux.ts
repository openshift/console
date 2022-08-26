import { ReduxReducer as ReduxReducerCoreType } from '@openshift/dynamic-plugin-sdk';
import { Reducer } from 'redux';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

/**
 * @deprecated use `core.redux-reducer` extension instead
 * Adds new reducer to Console Redux store which operates on `plugins.<scope>` substate.
 */
export type ReduxReducer = ExtensionDeclaration<
  'console.redux-reducer',
  {
    /** The key to represent the reducer-managed substate within the Redux state object. */
    scope: string;
    /** The reducer function, operating on the reducer-managed substate. */
    reducer: CodeRef<Reducer>;
  }
>;

/** Core equivalent of `console.redux-reducer` extension. */
export type CoreReduxReducer = ExtensionDeclaration<
  'core.redux-reducer',
  ReduxReducerCoreType['properties']
>;

// Type guards

export const isReduxReducer = (e: Extension): e is ReduxReducer =>
  e.type === 'console.redux-reducer';

export const isCoreReduxReducer = (e: Extension): e is CoreReduxReducer =>
  e.type === 'core.redux-reducer';
