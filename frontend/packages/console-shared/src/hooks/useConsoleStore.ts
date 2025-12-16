import { useStore } from 'react-redux';
import type store from '@console/internal/redux';

// TODO: When upgrading to react-redux v9, use the built-in `withTypes` method.
// See: https://github.com/reduxjs/react-redux/releases/tag/v9.1.0

/**
 * A hook to access the console redux store.
 *
 * See {@link useStore} for more details.
 */
export const useConsoleStore = useStore as () => typeof store;
