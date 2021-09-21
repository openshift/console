import { applyMiddleware, combineReducers, compose, createStore, Store } from 'redux';
import thunk from './middleware/thunk';
import { baseReducers } from './reducers';
import { RootState } from './types';

const composeEnhancers =
  (process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose;

let cachedStore: Store<RootState> = null;
const useReduxStore = (): Store<RootState> => {
  if (!cachedStore) {
    const store = createStore(
      combineReducers<RootState>(baseReducers),
      {},
      composeEnhancers(applyMiddleware(thunk)),
    );

    if (process.env.NODE_ENV !== 'production') {
      // Expose Redux store for debugging
      window.store = store;
    }

    cachedStore = store;
  }

  return cachedStore;
};

export default useReduxStore;
