import * as _ from 'lodash';
// import * as k8sActions from '@console/internal/actions/k8s';
import { K8sModel } from '../../../api/common-types';
import * as k8sActions from '../../../app/k8s/actions/k8s';
import { SDKStoreState } from '../../../app/redux-types';
import { WatchK8sResource } from '../../../extensions/console-types';
import { getReferenceForModel } from '../k8s-ref';
import { GetIDAndDispatch, MakeQuery, Query } from './k8s-watch-types';

export class NoModelError extends Error {
  constructor() {
    super('Model does not exist');
  }
}

export const makeReduxID = (k8sKind: K8sModel, query) => {
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

export const getReduxData = (immutableData, resource: WatchK8sResource) => {
  if (!immutableData) {
    return null;
  }
  if (resource.isList) {
    return immutableData.toArray().map((a) => a.toJSON());
  }
  if (immutableData.toJSON) {
    return immutableData.toJSON();
  }
  return null;
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
    ? k8sActions.watchK8sList(id, query, k8sModel)
    : k8sActions.watchK8sObject(id, resource.name, resource.namespace, query, k8sModel);
  return { id, dispatch };
};
