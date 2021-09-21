import * as _ from 'lodash';
import { combineReducers, ReducersMapObject } from 'redux';
import { isReduxReducer, ReduxReducer, useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { baseReducers } from './reducers';
import { RootState } from './types';
import { useReduxStore } from './index';

const useReduxReducerExtensions = (): boolean => {
  const store = useReduxStore();
  const [reduxReducerExtensions, reducersResolved] = useResolvedExtensions<ReduxReducer>(
    isReduxReducer,
  );

  if (!reducersResolved) return false;

  const pluginReducers: ReducersMapObject = {};

  reduxReducerExtensions.forEach(({ properties: { scope, reducer } }) => {
    pluginReducers[scope] = reducer;
  });

  const nextReducers: ReducersMapObject<RootState> = _.isEmpty(pluginReducers)
    ? baseReducers
    : { plugins: combineReducers(pluginReducers), ...baseReducers };

  store.replaceReducer(combineReducers<RootState>(nextReducers));

  return true;
};

export default useReduxReducerExtensions;
