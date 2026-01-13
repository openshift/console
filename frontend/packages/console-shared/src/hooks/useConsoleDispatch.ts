import { useDispatch } from 'react-redux';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { RootState } from '@console/internal/redux';

// TODO: When upgrading to react-redux v9, use the built-in `withTypes` method.
// See: https://github.com/reduxjs/react-redux/releases/tag/v9.1.0

/**
 * A hook to access the console redux `dispatch` function.
 *
 * See {@link useDispatch} for more details.
 */
export const useConsoleDispatch: () => ThunkDispatch<RootState, undefined, AnyAction> = useDispatch;
