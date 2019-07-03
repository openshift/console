import { FirehoseResult } from '@console/internal/components/utils';
import { getName, getNamespace } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { EntityMap, K8sEntityMap } from '../types';

type KeyResolver<A> = (entity: A) => string;

export const getLookupId = <A extends K8sResourceKind>(entity: A): string =>
  `${getNamespace(entity)}-${getName(entity)}`;

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
    return createBasicLookup(loadingList.data, getKey || getLookupId);
  }
  return {};
};

export const prefixedId = (idPrefix: string, id: string): string =>
  idPrefix && id ? `${idPrefix}-${id}` : null;

export const getLoadedData = (
  result: FirehoseResult<K8sResourceKind | K8sResourceKind[]>,
  defaultValue = null,
) => (result && result.loaded ? result.data : defaultValue);
