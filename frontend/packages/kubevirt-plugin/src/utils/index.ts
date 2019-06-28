import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { FirehoseResult } from '@console/internal/components/utils';
import { K8sEntityMap } from '../types';

export const createBasicLookup = <A>(list, path): K8sEntityMap<A> => {
  return list.reduce((lookup, entity) => {
    lookup[_.get(entity, path)] = entity;
    return lookup;
  }, {});
};

export const createLookup = <A>(
  loadingList: FirehoseResult<A[] & K8sResourceKind>,
): K8sEntityMap<A> => {
  if (loadingList.loaded) {
    return createBasicLookup(loadingList.data, 'metadata.name');
  }
  return {};
};
