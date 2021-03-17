import { Reducer } from 'redux';
import { Extension } from '@console/plugin-sdk/src/typings/base';
import { CodeRef, EncodedCodeRef, UpdateExtensionProperties } from '../types';

namespace ExtensionProperties {
  /** Adds new reducer to Console Redux store which operates on `plugins.<scope>` substate. */
  export type ReduxReducer = {
    /** The key to represent the reducer-managed substate within the Redux state object. */
    scope: string;
    /** The reducer function, operating on the reducer-managed substate. */
    reducer: EncodedCodeRef;
  };

  export type ReduxReducerCodeRefs = {
    reducer: CodeRef<Reducer>;
  };
}

// Extension types

export type ReduxReducer = Extension<ExtensionProperties.ReduxReducer> & {
  type: 'console.redux-reducer';
};

export type ResolvedReduxReducer = UpdateExtensionProperties<
  ReduxReducer,
  ExtensionProperties.ReduxReducerCodeRefs
>;

// Type guards

export const isReduxReducer = (e: Extension): e is ResolvedReduxReducer =>
  e.type === 'console.redux-reducer';
