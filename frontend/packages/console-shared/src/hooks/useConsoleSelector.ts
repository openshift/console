import type { TypedUseSelectorHook } from 'react-redux';
import { useSelector } from 'react-redux';
import type { RootState } from '@console/internal/redux';

// TODO: When upgrading to react-redux v9, use the built-in `withTypes` method.
// See: https://github.com/reduxjs/react-redux/releases/tag/v9.1.0

/**
 * A hook to access the console redux state.
 *
 * See {@link useSelector} for more details.
 */
export const useConsoleSelector: TypedUseSelectorHook<RootState> = useSelector;
