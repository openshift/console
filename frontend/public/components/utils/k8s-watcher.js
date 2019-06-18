import * as _ from 'lodash';

export const makeReduxID = (k8sKind = {}, query) => {
  let qs = '';
  if (!_.isEmpty(query)) {
    qs = `---${JSON.stringify(query)}`;
  }

  return `${k8sKind.plural}${qs}`;
};

/** @type {(namespace: string, labelSelector?: any, fieldSelector?: any, name?: string) => {[key: string]: string}} */
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
