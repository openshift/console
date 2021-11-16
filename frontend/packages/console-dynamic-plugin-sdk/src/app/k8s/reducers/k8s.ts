import { Map as ImmutableMap, fromJS } from 'immutable';
import * as _ from 'lodash';
import { K8sState } from '../../redux-types';
import { ActionType, K8sAction } from '../actions/k8s';

const getQN: (obj) => string = (obj) => {
  const { name, namespace } = obj.metadata;
  // Name + namespace is not unique for PackageManifest resources, so include the catalog source.
  // TODO: We should be able to remove this when the upstream OLM bug is fixed:
  //       https://bugzilla.redhat.com/show_bug.cgi?id=1814822
  if (obj.apiVersion === 'packages.operators.coreos.com/v1' && obj.kind === 'PackageManifest') {
    return `(${obj.status?.catalogSource})-${name}`;
  }
  return (namespace ? `(${namespace})-` : '') + name;
};

const moreRecent = (a, b) => {
  const metaA = a.get('metadata').toJSON();
  const metaB = b.get('metadata').toJSON();
  if (metaA.uid !== metaB.uid) {
    return new Date(metaA.creationTimestamp) > new Date(metaB.creationTimestamp);
  }
  return parseInt(metaA.resourceVersion, 10) > parseInt(metaB.resourceVersion, 10);
};

const removeFromList = (list, resource) => {
  const qualifiedName = getQN(resource);
  // eslint-disable-next-line no-console
  console.log(`deleting ${qualifiedName}`);
  return list.delete(qualifiedName);
};

const updateList = (list: ImmutableMap<string, any>, nextJS) => {
  const qualifiedName = getQN(nextJS);
  const current = list.get(qualifiedName);
  const next = fromJS(nextJS);

  if (!current) {
    return list.set(qualifiedName, next);
  }

  if (!moreRecent(next, current)) {
    return list;
  }

  // TODO: (kans) only store the data for things we display ...
  //  and then only do this comparison for the same stuff!
  if (
    current
      .deleteIn(['metadata', 'resourceVersion'])
      .equals(next.deleteIn(['metadata', 'resourceVersion']))
  ) {
    // If the only thing that differs is resource version, don't fire an update.
    return list;
  }

  return list.set(qualifiedName, next);
};

const loadList = (oldList, resources) => {
  const existingKeys = new Set(oldList.keys());
  return oldList.withMutations((list) => {
    (resources || []).forEach((r) => {
      const qualifiedName = getQN(r);
      existingKeys.delete(qualifiedName);
      const next = fromJS(r);
      const current = list.get(qualifiedName);
      if (!current || moreRecent(next, current)) {
        list.set(qualifiedName, next);
      }
    });
    existingKeys.forEach((k) => {
      const r = list.get(k);
      const metadata = r.get('metadata').toJSON();
      if (!metadata.deletionTimestamp) {
        // eslint-disable-next-line no-console
        console.warn(`${metadata.namespace}-${metadata.name} is gone with no deletion timestamp!`);
      }
      list.delete(k);
    });
  });
};

const sdkK8sReducers = (state: K8sState, action: K8sAction): K8sState => {
  if (!state) {
    return fromJS({});
  }

  let newList;
  switch (action.type) {
    case ActionType.StartWatchK8sObject:
      return state.set(
        action.payload.id,
        ImmutableMap({
          loadError: '',
          loaded: false,
          data: {},
        }),
      );

    case ActionType.StartWatchK8sList:
      if (state.getIn([action.payload.id, 'data'])) {
        return state;
      }

      // We mergeDeep instead of overwriting state because it's possible to add filters before load/watching
      return state.mergeDeep({
        [action.payload.id]: {
          loadError: '',
          // has the data set been loaded successfully
          loaded: false,
          // Canonical data
          data: ImmutableMap(),
          // client side filters to be applied externally (ie, we keep all data intact)
          filters: ImmutableMap(),
          // The name of an element in the list that has been "selected"
          selected: null,
        },
      });

    case ActionType.ModifyObject: {
      const { k8sObjects, id } = action.payload;
      let currentJS = state.getIn([id, 'data'], {});
      // getIn can return JS object or Immutable object
      if (currentJS.toJSON) {
        currentJS = currentJS.toJSON();
        currentJS.metadata.resourceVersion = k8sObjects.metadata.resourceVersion;
        if (_.isEqual(currentJS, k8sObjects)) {
          // If the only thing that differs is resource version, don't fire an update.
          return state;
        }
      }
      return state.mergeIn([id], {
        loadError: '',
        loaded: true,
        data: k8sObjects,
      });
    }

    case ActionType.StopWatchK8s:
      return state.delete(action.payload.id);

    case ActionType.Errored:
      if (!state.getIn([action.payload.id, 'data'])) {
        return state;
      }
      /* Don't overwrite data or loaded state if there was an error. Better to
       * keep stale data around than to suddenly have it disappear on a user.
       */
      return state.setIn([action.payload.id, 'loadError'], action.payload.k8sObjects);

    case ActionType.Loaded:
      if (!state.getIn([action.payload.id, 'data'])) {
        return state;
      }
      // eslint-disable-next-line no-console
      console.info(`loaded ${action.payload.id}`);
      // eslint-disable-next-line no-param-reassign
      state = state.mergeDeep({
        [action.payload.id]: { loaded: true, loadError: '' },
      });
      newList = loadList(state.getIn([action.payload.id, 'data']), action.payload.k8sObjects);
      break;

    case ActionType.UpdateListFromWS:
      newList = state.getIn([action.payload.id, 'data']);
      // k8sObjects is an array of k8s WS Events
      for (const { type, object } of action.payload.k8sObjects) {
        switch (type) {
          case 'DELETED':
            newList = removeFromList(newList, object);
            break;
          case 'ADDED':
          case 'MODIFIED':
            newList = updateList(newList, object);
            break;
          default:
            // possible `ERROR` type or other
            // eslint-disable-next-line no-console
            console.warn(`unknown websocket action: ${type}`);
          // console.warn(`unknown websocket action: ${type} (${_.get(event, 'object.message')})`);
        }
      }
      break;

    case ActionType.BulkAddToList:
      if (!state.getIn([action.payload.id, 'data'])) {
        return state;
      }
      newList = state
        .getIn([action.payload.id, 'data'])
        .merge(
          action.payload.k8sObjects.reduce(
            (map, obj) => map.set(getQN(obj), fromJS(obj)),
            ImmutableMap(),
          ),
        );
      break;
    case ActionType.FilterList:
      return state.setIn([action.payload.id, 'filters', action.payload.name], action.payload.value);
    default:
      return state;
  }
  return state.setIn([action.payload.id, 'data'], newList);
};

export default sdkK8sReducers;
