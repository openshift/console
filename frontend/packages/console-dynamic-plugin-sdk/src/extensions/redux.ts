import { ReduxReducer as CoreReduxReducer } from '@openshift/dynamic-plugin-sdk';
import { Extension } from '../types';
import { RepackageExtension } from './data-types';

/** Adds new reducer to Console Redux store which operates on `plugins.<scope>` substate. */
export type ReduxReducer = RepackageExtension<'console.redux-reducer', CoreReduxReducer>;

// Type guards

export const isReduxReducer = (e: Extension): e is ReduxReducer =>
  e.type === 'console.redux-reducer';
