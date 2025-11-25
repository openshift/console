import { Reducer } from 'redux';
import { Extension, ExtensionDeclaration, CodeRef } from '../types';

/** Adds new reducer to Console Redux store which operates on `plugins.<scope>` substate. */
export type ReduxReducer = ExtensionDeclaration<
  'console.redux-reducer',
  {
    /** The key to represent the reducer-managed substate within the Redux state object. */
    scope: string;
    /** The reducer function, operating on the reducer-managed substate. */
    reducer: CodeRef<Reducer>;
  }
>;

// Type guards

export const isReduxReducer = (e: Extension): e is ReduxReducer =>
  e.type === 'console.redux-reducer';
