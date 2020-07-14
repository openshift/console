import { K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResult } from '@console/internal/components/utils/types';
import { getUID } from '../selectors/common';

export type EntityMap<A> = { [propertyName: string]: A };
export type K8sEntityMap<A extends K8sResourceKind> = EntityMap<A>;

type KeyResolver<A> = (entity: A) => string;

export const createBasicLookup = <A>(list: A[], getKey: KeyResolver<A>): EntityMap<A> => {
  return (list || []).reduce((lookup, entity) => {
    const key = getKey(entity);
    if (key) {
      lookup[key] = entity;
    }
    return lookup;
  }, {});
};

export const createLookup = <A extends K8sResourceKind>(
  loadingList: FirehoseResult<A[]>,
  getKey?: KeyResolver<A>,
): K8sEntityMap<A> => {
  if (loadingList && loadingList.loaded) {
    return createBasicLookup(loadingList.data, getKey || getUID);
  }
  return {};
};

export const getRandomChars = (len = 6): string => {
  return Math.random()
    .toString(36)
    .replace(/[^a-z0-9]+/g, '')
    .substr(1, len);
};
