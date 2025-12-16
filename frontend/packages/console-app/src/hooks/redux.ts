import { useDispatch, useSelector, TypedUseSelectorHook, useStore } from 'react-redux';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
/* eslint-disable import/no-duplicates */
// A type-only import can specify a default import or named bindings, but not both.
import type store from '@console/internal/redux';
import type { RootState } from '@console/internal/redux';
/* eslint-enable import/no-duplicates */

// TODO: When upgrading to react-redux v9, use the built-in `withTypes` method.
// See: https://github.com/reduxjs/react-redux/releases/tag/v9.1.0

/**
 * A hook to access the console redux `dispatch` function.
 *
 * See {@link useDispatch} for more details.
 */
export const useConsoleDispatch: () => ThunkDispatch<RootState, undefined, AnyAction> = useDispatch;

/**
 * A hook to access the console redux state.
 *
 * See {@link useSelector} for more details.
 */
export const useConsoleSelector: TypedUseSelectorHook<RootState> = useSelector;

/**
 * A hook to access the console redux store.
 *
 * See {@link useStore} for more details.
 */
export const useConsoleStore = useStore as () => typeof store;
