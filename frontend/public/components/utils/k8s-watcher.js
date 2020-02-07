import * as _ from 'lodash-es';

import { referenceForModel } from '../../module/k8s';

export const makeReduxID = (k8sKind = {}, query) => {
  let qs = '';
  if (!_.isEmpty(query)) {
    qs = `---${JSON.stringify(query)}`;
  }

  return `${referenceForModel(k8sKind)}${qs}`;
};

/** @type {(namespace: string, labelSelector?: any, fieldSelector?: any, name?: string, limit?: number) => {[key: string]: string}} */
export const makeQuery = (namespace, labelSelector, fieldSelector, name, limit) => {
  const query = {};

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
