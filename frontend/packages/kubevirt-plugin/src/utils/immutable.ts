import { List } from 'immutable';

export const concatImmutableLists = (...args) =>
  args.filter((list) => list).reduce((acc, nextArray) => acc.concat(nextArray), List());

export const immutableListToShallowJS = (list, defaultValue = []) =>
  list ? list.toArray().map((p) => p.toJSON()) : defaultValue;

export const hasTruthyValue = (obj) => !!(obj && !!obj.find((value) => value));

export const iGet = (obj, key: string, defaultValue = undefined) =>
  obj ? obj.get(key, defaultValue) : defaultValue;

export const iGetIn = (obj, path: string[], defaultValue = undefined) =>
  obj ? obj.getIn(path, defaultValue) : defaultValue;

export const iGetIsLoaded = (result): boolean => iGet(result, 'loaded', false);

export const iGetLoadedData = (result, defaultValue = undefined) =>
  iGetIsLoaded(result) && !iGet(result, 'loadError') ? iGet(result, 'data') : defaultValue;
