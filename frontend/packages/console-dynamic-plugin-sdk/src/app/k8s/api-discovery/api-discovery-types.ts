import type { Store, AnyAction } from 'redux';
import type { ActionType as Action } from 'typesafe-actions';
import type { K8sVerb } from '../../../api/common-types';

export type InitApiDiscovery = (store: Store<any, Action<AnyAction>>) => void;

export type APIResourceList = {
  kind: 'APIResourceList';
  apiVersion: 'v1';
  groupVersion: string;
  resources?: {
    name: string;
    singularName?: string;
    namespaced?: boolean;
    kind: string;
    verbs: K8sVerb[];
    shortNames?: string[];
  }[];
};
