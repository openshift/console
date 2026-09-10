import * as _ from 'lodash';
import type { K8sModel } from '../../../api/common-types';
import * as k8sActions from '../../../app/k8s/actions/k8s';
import type { SDKStoreState } from '../../../app/redux-types';
import type { WatchK8sResource } from '../../../extensions/console-types';
import { CustomError } from '../../error/custom-error';
import { getReferenceForModel } from '../k8s-ref';
import type { GetIDAndDispatch, MakeQuery, Query } from './k8s-watch-types';

export class NoModelError extends CustomError {
  constructor() {
    super('Model does not exist');
  }
}

export const makeReduxID = (k8sKind: K8sModel, query: Query) => {
  let qs = '';
  if (!_.isEmpty(query)) {
    qs = `---${JSON.stringify(query)}`;
  }

  return `${getReferenceForModel(k8sKind || ({} as K8sModel))}${qs}`;
};

export const makeQuery: MakeQuery = (namespace, labelSelector, fieldSelector, name, limit) => {
  const query: Query = {};

  if (!_.isEmpty(labelSelector)) {
    query.labelSelector = labelSelector;
  }

  if (!_.isEmpty(namespace)) {
    query.ns = namespace;
  }

  if (!_.isEmpty(name)) {
    query.name = name;
  }

  if (fieldSelector) {
    query.fieldSelector = fieldSelector;
  }

  if (limit) {
    query.limit = limit;
  }
  return query;
};

// Cache the array derived from a keyed list object so repeated calls with the
// same stored reference return a stable array reference. This preserves
// referential stability, avoiding unnecessary consumer re-renders.
const reduxListDataCache = new WeakMap<object, unknown[]>();

export const getReduxData = (data, resource: WatchK8sResource) => {
  if (data == null) {
    return null;
  }
  if (resource.isList) {
    if (Array.isArray(data) || typeof data !== 'object') {
      return data;
    }
    let list = reduxListDataCache.get(data);
    if (!list) {
      list = Object.values(data);
      reduxListDataCache.set(data, list);
    }
    return list;
  }
  // Before the watched object has loaded, the reducer stores an empty
  // placeholder object. Surface that as null rather than an empty object, matching
  // the previous behavior where only fully loaded objects produced data.
  if (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0) {
    return null;
  }
  return data;
};

export const getIDAndDispatch: GetIDAndDispatch<SDKStoreState> = (resource, k8sModel) => {
  if (!k8sModel || !resource) {
    return null;
  }
  const query = makeQuery(
    resource.namespace,
    resource.selector,
    resource.fieldSelector,
    resource.name,
    resource.limit,
  );
  const id = makeReduxID(k8sModel, query);
  const dispatch = resource.isList
    ? k8sActions.watchK8sList(id, query, k8sModel, null, resource.partialMetadata)
    : k8sActions.watchK8sObject(
        id,
        resource.name,
        resource.namespace,
        query,
        k8sModel,
        resource.partialMetadata,
      );
  return { id, dispatch };
};
