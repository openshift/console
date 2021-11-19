import { action, ActionType as Action } from 'typesafe-actions';
import { UserKind } from '../../redux-types';

export enum ActionType {
  SetNamespace = 'setNamespace',
  SetUser = 'setUser',
  BeginImpersonate = 'beginImpersonate',
  EndImpersonate = 'endImpersonate',
}

export const setNamespace = (namespace: string = '') =>
  action(ActionType.SetNamespace, { namespace: namespace.trim() });
export const setUser = (user: UserKind) => action(ActionType.SetUser, { user });
export const beginImpersonate = (kind: string, name: string, subprotocols: string[]) =>
  action(ActionType.BeginImpersonate, { kind, name, subprotocols });
export const endImpersonate = () => action(ActionType.EndImpersonate);

const coreActions = {
  setNamespace,
  setUser,
  beginImpersonate,
  endImpersonate,
};

export type CoreAction = Action<typeof coreActions>;
