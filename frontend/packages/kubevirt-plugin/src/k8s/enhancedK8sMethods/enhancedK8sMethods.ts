import { get } from 'lodash';
import {
  k8sCreate as _k8sCreate,
  k8sGet as _k8sGet,
  k8sKill as _k8sKill,
  K8sKind,
  k8sPatch as _k8sPatch,
  K8sResourceCommon,
  K8sResourceKind,
  Patch,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { getFullResourceId } from '../../utils/utils';
import {
  K8sCreateError,
  K8sGetError,
  K8sKillError,
  K8sMultipleErrors,
  K8sPatchError,
} from './errors';
import { HistoryItem, HistoryType } from './types';
import { Wrapper } from '../wrapper/common/wrapper';
import { K8sResourceKindMethods } from '../wrapper/types/types';

export type EnhancedOpts = {
  disableHistory: boolean;
};

export class EnhancedK8sMethods {
  private readonly history: HistoryItem[] = [];

  private readonly modelMap: { [k: string]: K8sKind } = {};

  private registerKind = (kind: K8sKind) => {
    this.modelMap[referenceForModel(kind)] = kind;
  };

  private appendHistory = (historyItem: HistoryItem, enhancedOpts?: EnhancedOpts) => {
    if (!enhancedOpts || !enhancedOpts.disableHistory) {
      this.history.push(historyItem);
    }
  };

  k8sGet = async (
    kind: K8sKind,
    name: string,
    namespace: string,
    opts?,
    enhancedOpts?: EnhancedOpts,
  ) => {
    try {
      this.registerKind(kind);
      const result = await _k8sGet(kind, name, namespace, opts);
      this.appendHistory(new HistoryItem(HistoryType.GET, result), enhancedOpts);
      return result;
    } catch (error) {
      throw new K8sGetError(error.message, error, { name, namespace });
    }
  };

  k8sWrapperCreate = async <
    U extends K8sResourceCommon,
    T extends Wrapper<U, T> & K8sResourceKindMethods
  >(
    wrapper: T,
    opts?,
    enhancedOpts?: EnhancedOpts,
  ) => this.k8sCreate(wrapper.getModel(), wrapper.asResource(), opts, enhancedOpts);

  k8sCreate = async (kind: K8sKind, data: K8sResourceKind, opts?, enhancedOpts?: EnhancedOpts) => {
    try {
      this.registerKind(kind);
      const result = await _k8sCreate(kind, data, opts);
      this.appendHistory(new HistoryItem(HistoryType.CREATE, result), enhancedOpts);
      return result;
    } catch (error) {
      throw new K8sCreateError(error.message, error, data);
    }
  };

  k8sWrapperPatch = async <
    U extends K8sResourceCommon,
    T extends Wrapper<U, T> & K8sResourceKindMethods
  >(
    wrapper: T,
    patches: Patch[],
    enhancedOpts?: EnhancedOpts,
  ) => this.k8sPatch(wrapper.getModel(), wrapper.asResource(), patches, enhancedOpts);

  k8sPatch = async (
    kind: K8sKind,
    resource: K8sResourceKind,
    patches: Patch[],
    enhancedOpts?: EnhancedOpts,
  ) => {
    try {
      this.registerKind(kind);
      const result = await _k8sPatch(kind, resource, patches);
      this.appendHistory(new HistoryItem(HistoryType.PATCH, result), enhancedOpts);
      return result;
    } catch (error) {
      throw new K8sPatchError(error.message, error, resource, patches);
    }
  };

  k8sKill = async (
    kind: K8sKind,
    resource: K8sResourceKind,
    opts?,
    json?,
    enhancedOpts?: EnhancedOpts,
  ) => {
    try {
      this.registerKind(kind);
      const result = await _k8sKill(kind, resource, opts, json);
      this.appendHistory(new HistoryItem(HistoryType.DELETE, resource), enhancedOpts);
      return result;
    } catch (error) {
      throw new K8sKillError(error.message, error, resource);
    }
  };

  getHistory = () => [...this.history];

  /**
   * replay history and resolve actual state (living objects on the cluster)
   */
  getActualState = () => {
    const currentIndexes = {};
    const currentUnfilteredState: K8sResourceKind[] = [];

    this.history.forEach(({ type, object }) => {
      const id = getFullResourceId(object);
      const currentIdx = currentIndexes[id];
      switch (type) {
        case HistoryType.GET:
        case HistoryType.CREATE:
        case HistoryType.PATCH:
          if (currentIdx != null && currentIdx >= 0) {
            currentUnfilteredState[currentIdx] = object;
          } else {
            currentIndexes[id] = currentUnfilteredState.push(object) - 1;
          }
          break;
        case HistoryType.DELETE:
        case HistoryType.NOT_FOUND:
          currentUnfilteredState[currentIdx] = null;
          currentIndexes[id] = null;
          break;
        default:
          break;
      }
    });

    return currentUnfilteredState.filter((a) => a);
  };

  rollback = async () => {
    const state = this.getActualState();
    const errors = [];
    const deleteStatuses = [];

    // delete one by one in reverse order the objects were created in
    for (let i = state.length - 1; i >= 0; i--) {
      let obj;
      try {
        obj = state[i];
        // eslint-disable-next-line no-await-in-loop
        const result = await this.k8sKill(this.modelMap[referenceFor(obj)], obj);
        deleteStatuses.push(result);
      } catch (error) {
        if (get(error, 'json.code') === 404 || get(error, 'json.reason') === 'NotFound') {
          // happy path
          this.appendHistory(new HistoryItem(HistoryType.NOT_FOUND, obj));
          deleteStatuses.push(error.json);
        } else {
          errors.push(error);
        }
      }
    }

    if (errors.length > 0) {
      throw new K8sMultipleErrors('rollback', errors);
    }

    return deleteStatuses;
  };
}
