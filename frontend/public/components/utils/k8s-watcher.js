import actions from '../../module/k8s/k8s-actions';

const id_ = (k8sType, query) => {
  let qs = '';
  if (!_.isEmpty(query)) {
    qs = `---${JSON.stringify(query)}`;
  }

  return `${k8sType.kind.plural}${qs}`;
};

const makeQuery_ = (namespace, labelSelector, fieldSelector, name) => {
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
  constructor (k8sType, namespace, labelSelector, fieldSelector, name, store) {
    this.k8sType = k8sType;
    this.query = makeQuery_(namespace, labelSelector, fieldSelector, name);
    this.id = id_(k8sType, this.query);
    this.namespace = namespace;
    this.name = name;
    this.dispatch = store.dispatch;
  }

  watchObject () {
    // eslint-disable-next-line no-console
    console.log(`opening ${this.id}`);
    this.dispatch(actions.watchK8sObject(this.id, this.name, this.namespace, this.query, this.k8sType));
    return this;
  }

  watchList () {
    // eslint-disable-next-line no-console
    console.log(`opening ${this.id}`);
    this.dispatch(actions.watchK8sList(this.id, this.query, this.k8sType));
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
