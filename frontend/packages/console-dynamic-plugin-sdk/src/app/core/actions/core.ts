import { action, ActionType as Action } from 'typesafe-actions';
import { UserInfo } from '../../../extensions';
import { AdmissionWebhookWarning } from '../../redux-types';

export enum ActionType {
  SetUser = 'setUser',
  BeginImpersonate = 'beginImpersonate',
  EndImpersonate = 'endImpersonate',
  SetActiveCluster = 'setActiveCluster',
  SetAdmissionWebhookWarning = 'setAdmissionWebhookWarning',
  RemoveAdmissionWebhookWarning = 'removeAdmissionWebhookWarning',
}

export const setUser = (userInfo: UserInfo) => action(ActionType.SetUser, { userInfo });
export const beginImpersonate = (kind: string, name: string, subprotocols: string[]) =>
  action(ActionType.BeginImpersonate, { kind, name, subprotocols });
export const endImpersonate = () => action(ActionType.EndImpersonate);
export const setAdmissionWebhookWarning = (id: string, warning: AdmissionWebhookWarning) =>
  action(ActionType.SetAdmissionWebhookWarning, { id, warning });
export const removeAdmissionWebhookWarning = (id) =>
  action(ActionType.RemoveAdmissionWebhookWarning, { id });
const coreActions = {
  setUser,
  beginImpersonate,
  endImpersonate,
  setAdmissionWebhookWarning,
  removeAdmissionWebhookWarning,
};

export type CoreAction = Action<typeof coreActions>;
