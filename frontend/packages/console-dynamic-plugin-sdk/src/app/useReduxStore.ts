import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useStore } from 'react-redux';
import { applyMiddleware, combineReducers, createStore, compose, Store } from 'redux';
import thunk from 'redux-thunk';
import { baseReducers } from './redux';
import { RootState } from './redux-types';
import storeHandler from './storeHandler';

const composeEnhancers =
  (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

/**
 * `useReduxStore` will provide the store instance if present or else create one along with info if the context was present.
 *
 * @example
 * ```ts
 * function Component () {
 *   const {store, storeContextPresent} = useReduxStore()
 *   return ...
 * }
 * ```
 */
export const useReduxStore = (): { store: Store<RootState>; storeContextPresent: boolean } => {
  const storeContext = useStore();
  const [storeContextPresent, setStoreContextPresent] = React.useState(false);
  const store = React.useMemo(() => {
    // check if store exists and if not create it
    if (storeContext) {
      setStoreContextPresent(true);
      storeHandler.setStore(storeContext);
    } else {
      // eslint-disable-next-line no-console
      console.log('Creating the SDK redux store');
      setStoreContextPresent(false);
      const storeInstance = createStore(
        combineReducers<RootState>(baseReducers),
        {},
        composeEnhancers(applyMiddleware(thunk)),
      );
      storeHandler.setStore(storeInstance);
    }
    return storeHandler.getStore();
  }, [storeContext]);

  return { store, storeContextPresent };
};
