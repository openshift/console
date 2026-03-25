import type { ActionType as Action } from 'typesafe-actions';
import { action } from 'typesafe-actions';
import type { UserKind } from '@console/internal/module/k8s/types';
import type { UserInfo } from '../../../extensions';
import type { AdmissionWebhookWarning } from '../../redux-types';

export enum ActionType {
  SetUser = 'setUser',
  SetUserResource = 'setUserResource',
  BeginImpersonate = 'beginImpersonate',
  EndImpersonate = 'endImpersonate',
  SetActiveCluster = 'setActiveCluster',
  SetAdmissionWebhookWarning = 'setAdmissionWebhookWarning',
  RemoveAdmissionWebhookWarning = 'removeAdmissionWebhookWarning',
}

export const setUser = (userInfo: UserInfo) => action(ActionType.SetUser, { userInfo });
export const setUserResource = (userResource: UserKind) =>
  action(ActionType.SetUserResource, { userResource });
export const beginImpersonate = (
  kind: string,
  name: string,
  subprotocols: string[],
  groups?: string[],
) => action(ActionType.BeginImpersonate, { kind, name, subprotocols, groups });
export const endImpersonate = () => action(ActionType.EndImpersonate);
export const setAdmissionWebhookWarning = (id: string, warning: AdmissionWebhookWarning) =>
  action(ActionType.SetAdmissionWebhookWarning, { id, warning });
export const removeAdmissionWebhookWarning = (id) =>
  action(ActionType.RemoveAdmissionWebhookWarning, { id });
const coreActions = {
  setUser,
  setUserResource,
  beginImpersonate,
  endImpersonate,
  setAdmissionWebhookWarning,
  removeAdmissionWebhookWarning,
};

export type CoreAction = Action<typeof coreActions>;
