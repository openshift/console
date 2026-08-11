import * as _ from 'lodash';
import type { K8sModel } from '../../../api/common-types';
import { getReferenceForModel } from '../../../utils/k8s/k8s-ref';
import { getNamespacedResources, allModels } from '../../../utils/k8s/k8s-utils';
import type { K8sState } from '../../redux-types';
import type { K8sAction } from '../actions/k8s';
import { ActionType } from '../actions/k8s';
import { getK8sDataById } from './k8sSelector';

const getQN: (obj) => string = (obj) => {
  const { name, namespace } = obj.metadata;
  if (obj.apiVersion === 'packages.operators.coreos.com/v1' && obj.kind === 'PackageManifest') {
    return `(${obj.status?.catalogSource})-${name}`;
  }
  return (namespace ? `(${namespace})-` : '') + name;
};

const moreRecent = (a, b) => {
  const metaA = a.metadata;
  const metaB = b.metadata;
  if (metaA.uid !== metaB.uid) {
    return new Date(metaA.creationTimestamp) > new Date(metaB.creationTimestamp);
  }
  return parseInt(metaA.resourceVersion, 10) > parseInt(metaB.resourceVersion, 10);
};

const removeFromList = (list: Record<string, any>, resource) => {
  const qualifiedName = getQN(resource);
  // eslint-disable-next-line no-console
  console.log(`deleting ${qualifiedName}`);
  const { [qualifiedName]: _removed, ...remaining } = list;
  return remaining;
};

const updateList = (list: Record<string, any>, nextObj) => {
  const qualifiedName = getQN(nextObj);
  const current = list[qualifiedName];

  if (!current) {
    return { ...list, [qualifiedName]: nextObj };
  }

  if (!moreRecent(nextObj, current)) {
    return list;
  }

  const currentNoRV = {
    ...current,
    metadata: { ...current.metadata, resourceVersion: undefined },
  };
  const nextNoRV = {
    ...nextObj,
    metadata: { ...nextObj.metadata, resourceVersion: undefined },
  };
  if (_.isEqual(currentNoRV, nextNoRV)) {
    return list;
  }

  return { ...list, [qualifiedName]: nextObj };
};

const loadList = (oldList: Record<string, any>, resources) => {
  const newList = { ...oldList };
  const existingKeys = new Set(Object.keys(newList));

  (resources || []).forEach((r) => {
    const qualifiedName = getQN(r);
    existingKeys.delete(qualifiedName);
    const current = newList[qualifiedName];
    if (!current || moreRecent(r, current)) {
      newList[qualifiedName] = r;
    }
  });

  existingKeys.forEach((k) => {
    const r = newList[k];
    const { metadata } = r;
    if (!metadata.deletionTimestamp) {
      // eslint-disable-next-line no-console
      console.warn(`${metadata.namespace}-${metadata.name} is gone with no deletion timestamp!`);
    }
    delete newList[k];
  });

  return newList;
};

const sdkK8sReducers = (state: K8sState, action: K8sAction): K8sState => {
  if (!state) {
    return {
      RESOURCES: {
        models: {} as Record<string, K8sModel>,
        inFlight: false,
        loaded: false,
      },
    };
  }

  let newList;
  switch (action.type) {
    case ActionType.GetResourcesInFlight:
      return {
        ...state,
        RESOURCES: { ...state.RESOURCES, inFlight: true },
      };

    case ActionType.ReceivedResources: {
      const currentModels = state.RESOURCES.models;
      const updatedModels = { ...currentModels };

      action.payload.resources.models
        .filter((model) => !currentModels[getReferenceForModel(model)])
        .filter((model) => {
          const existingModel = currentModels[model.kind];
          return (
            !existingModel || getReferenceForModel(existingModel) !== getReferenceForModel(model)
          );
        })
        .forEach((newModel) => {
          newModel.namespaced
            ? getNamespacedResources().add(getReferenceForModel(newModel))
            : getNamespacedResources().delete(getReferenceForModel(newModel));

          const entry = Object.entries(allModels()).find(
            ([, staticModel]) =>
              getReferenceForModel(staticModel as K8sModel) === getReferenceForModel(newModel),
          );
          const [modelRef, model] = entry || [getReferenceForModel(newModel), newModel];
          updatedModels[modelRef] = {
            ...(model as K8sModel),
            verbs: newModel.verbs,
            shortNames: newModel.shortNames,
          };
        });

      return {
        ...state,
        RESOURCES: {
          ...state.RESOURCES,
          models: updatedModels,
          allResources: action.payload.resources.allResources,
          safeResources: action.payload.resources.safeResources,
          adminResources: action.payload.resources.adminResources,
          configResources: action.payload.resources.configResources,
          clusterOperatorConfigResources: action.payload.resources.clusterOperatorConfigResources,
          namespacedSet: action.payload.resources.namespacedSet,
          groupToVersionMap: action.payload.resources.groupVersionMap,
          inFlight: false,
          loaded: true,
        },
      };
    }

    case ActionType.StartWatchK8sObject:
      return {
        ...state,
        [action.payload.id]: {
          loadError: '',
          loaded: false,
          data: {},
        },
      };

    case ActionType.StartWatchK8sList:
      if (getK8sDataById(state, action.payload.id)) {
        return state;
      }

      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          loadError: '',
          loaded: false,
          data: {},
          filters: {},
          selected: null,
        },
      };

    case ActionType.ModifyObject: {
      const { k8sObjects, id } = action.payload;
      const currentData = getK8sDataById(state, id) || {};
      if (
        currentData.metadata &&
        currentData.metadata.resourceVersion !== k8sObjects.metadata.resourceVersion
      ) {
        const currentNoRV = {
          ...currentData,
          metadata: {
            ...currentData.metadata,
            resourceVersion: k8sObjects.metadata.resourceVersion,
          },
        };
        if (_.isEqual(currentNoRV, k8sObjects)) {
          return state;
        }
      }
      return {
        ...state,
        [id]: {
          ...state[id],
          loadError: '',
          loaded: true,
          data: k8sObjects,
        },
      };
    }

    case ActionType.StopWatchK8s: {
      const { [action.payload.id]: _removed, ...remaining } = state;
      return remaining;
    }

    case ActionType.Errored:
      if (!getK8sDataById(state, action.payload.id)) {
        return state;
      }
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          loadError: action.payload.k8sObjects,
        },
      };

    case ActionType.Loaded:
      if (!getK8sDataById(state, action.payload.id)) {
        return state;
      }
      // eslint-disable-next-line no-console
      console.info(`loaded ${action.payload.id}`);
      newList = loadList(getK8sDataById(state, action.payload.id), action.payload.k8sObjects);
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          loaded: true,
          loadError: '',
          data: newList,
        },
      };

    case ActionType.UpdateListFromWS:
      newList = getK8sDataById(state, action.payload.id);
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
            // eslint-disable-next-line no-console
            console.warn(`unknown websocket action: ${type}`);
        }
      }
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          data: newList,
        },
      };

    case ActionType.BulkAddToList:
      if (!getK8sDataById(state, action.payload.id)) {
        return state;
      }
      newList = { ...getK8sDataById(state, action.payload.id) };
      action.payload.k8sObjects.forEach((obj) => {
        newList[getQN(obj)] = obj;
      });
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          data: newList,
        },
      };

    case ActionType.FilterList:
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          filters: {
            ...state[action.payload.id]?.filters,
            [action.payload.name]: action.payload.value,
          },
        },
      };

    default:
      return state;
  }
};

export default sdkK8sReducers;
