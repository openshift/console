const Immutable = require('immutable');

import {types} from './k8s-actions';

const moreRecent = (a, b) => {
  const metaA  = a.get('metadata').toJSON();
  const metaB  = b.get('metadata').toJSON();
  if (metaA.uid !== metaB.uid) {
    return new Date(metaA.creationTimestamp) > new Date(metaB.creationTimestamp);
  }
  return parseInt(metaA.resourceVersion, 10) > parseInt(metaB.resourceVersion, 10);
};

const removeFromList = (list, resource) => {
  const uid = resource.metadata.name;
  // eslint-disable-next-line no-console
  console.log(`deleting ${uid}`);
  return list.delete(uid);
};

const updateList = (list, resource) => {
  const uid = resource.metadata.name;
  const current = list.get(uid);
  const next = Immutable.fromJS(resource);

  if (!current) {
    return list.set(uid, next);
  }

  if (!moreRecent(next, current)) {
    return list;
  }

  return list.set(uid, next);
};

const loadList = (list, resources) => {
  // TODO: not supported in ie :(
  const existingKeys = new Set(list.keys());
  return list.withMutations(list => {
    (resources || []).forEach(r => {
      const uid = r.metadata.name;
      existingKeys.delete(uid);
      const next = Immutable.fromJS(r);
      const current = list.get(uid);
      if (!current || moreRecent(next, current)) {
        list.set(r.metadata.name, next);
      }
    });
    existingKeys.forEach(k => {
      const r = list.get(k);
      if (!r.getIn(['metadata', 'deletionTimestamp'])) {
        return;
      }
      list.delete(k);
    });
  });
};

export default (state, action)  => {
  if (!state) {
    return Immutable.Map();
  }
  const {k8sObjects, id} = action;
  const list = state.getIn([id, 'data']);

  let newList;

  switch (action.type) {
    case types.filterList:
      const {name, value} = action;
      return state.setIn([id, 'filters', name], value);

    case types.watchK8sObject:
      return state.set(id, Immutable.Map({
        loadError: '',
        loaded: false,
        data: {},
      }));

    case types.modifyObject:
      return state.mergeIn([id], {
        loadError: '',
        loaded: true,
        data: k8sObjects,
      });

    case types.watchK8sList:
      if (list) {
        return state;
      }

      return state.set(id, Immutable.Map({
        loadError: '',
        loaded: false,
        data: Immutable.Map(),
        filters: Immutable.Map(),
      }));

    case types.stopK8sWatch:
      return state.delete(id);

    case types.loaded:
      if (!list) {
        return state;
      }
      // eslint-disable-next-line no-console
      console.info(`loaded ${id}`);
      state = state.setIn(
        [id, 'loaded'], true,
        [id, 'loadError'], ''
      );
      newList = loadList(list, k8sObjects);
      break;
    case types.deleteFromList:
      if (!list) {
        return state;
      }
      newList = removeFromList(list, k8sObjects);
      break;
    case types.addToList:
    case types.modifyList:
      if (!list) {
        return state;
      }
      newList = updateList(list, k8sObjects);
      break;
    case types.errored:
      if (!list) {
        return state;
      }
      return state.setIn(
        [id, 'loadError'], k8sObjects,
        [id, 'data'], {},
        [id, 'loaded'], false
      );
  }
  return state.setIn([id, 'data'], newList);
};
