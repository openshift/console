import * as _ from 'lodash';
import { List } from 'immutable';

export const concatImmutableLists = (...args): List<any> =>
  args.filter((list) => list).reduce((acc, nextArray) => acc.concat(nextArray), List());

export const iFirehoseResultToJS = (immutableValue, isList = true) => {
  if (!immutableValue) {
    return {};
  }

  const data = immutableValue.get('data');

  return {
    data: data && isList ? data.toArray().map((p) => p.toJSON()) : data.toJS(),
    loadError: immutableValue.get('loadError'),
    loaded: immutableValue.get('loaded'),
  };
};

export const immutableListToShallowJS = <A = any>(list, defaultValue: A[] = []): A[] =>
  list ? list.toArray().map((p) => p.toJSON()) : defaultValue;

export const immutableListToJS = <A = any>(list, defaultValue: A[] = []): A[] =>
  list ? list.toArray().map((p) => p.toJS()) : defaultValue;

export const hasTruthyValue = (obj) => !!(obj && !!obj.find((value) => value));

export const iGet = (obj, key: string, defaultValue = undefined) =>
  obj ? obj.get(key, defaultValue) : defaultValue;

export const toShallowJS = (obj, defaultValue = undefined, discardEmpty: boolean = false) => {
  if (discardEmpty && _.isEmpty(obj)) {
    return defaultValue;
  }
  return obj && obj.isEmpty && !obj.isEmpty() ? obj.toJSON() : defaultValue;
};

export const toJS = (obj, defaultValue = undefined) => (obj ? obj.toJS() : defaultValue);

export const iGetIn = (obj, path: string[], defaultValue = undefined) =>
  obj && obj.getIn ? obj.getIn(path, defaultValue) : defaultValue;

export const ihasIn = (obj, path: string[]) => obj && obj.hasIn(path);

export const iGetIsLoaded = (result): boolean => iGet(result, 'loaded', false);

export const iGetLoadedData = (result, defaultValue = undefined) =>
  iGetIsLoaded(result) && !iGet(result, 'loadError') ? iGet(result, 'data') : defaultValue;
