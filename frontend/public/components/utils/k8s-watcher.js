import * as _ from 'lodash';
import actions from '../../module/k8s/k8s-actions';

export const makeReduxID = (k8sKind, query) => {
  let qs = '';
  if (!_.isEmpty(query)) {
    qs = `---${JSON.stringify(query)}`;
  }

  return `${k8sKind.plural}${qs}`;
};

export const makeQuery = (namespace, labelSelector, fieldSelector, name) => {
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
  return query;
};

export class K8sWatcher {
  constructor (k8sKind, namespace, labelSelector, fieldSelector, name, store) {
    this.k8sKind = k8sKind;
    this.query = makeQuery(namespace, labelSelector, fieldSelector, name);
    this.id = makeReduxID(k8sKind, this.query);
    this.namespace = namespace;
    this.name = name;
    this.dispatch = store.dispatch;
  }

  watchObject () {
    // eslint-disable-next-line no-console
    console.log(`opening ${this.id}`);
    this.dispatch(actions.watchK8sObject(this.id, this.name, this.namespace, this.query, this.k8sKind));
    return this;
  }

  watchList () {
    // eslint-disable-next-line no-console
    console.log(`opening ${this.id}`);
    this.dispatch(actions.watchK8sList(this.id, this.query, this.k8sKind));
    return this;
  }

  unwatch () {
    this.dispatch(actions.stopK8sWatch(this.id));
    return this;
  }

  unwatchList () {
    this.dispatch(actions.stopK8sWatch(this.id));
  }
}
