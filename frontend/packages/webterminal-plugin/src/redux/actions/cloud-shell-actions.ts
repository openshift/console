import type { ActionType } from 'typesafe-actions';
import { action } from 'typesafe-actions';

export type DetachedSessionCleanup = {
  type: 'namespace' | 'pod';
  name: string;
  namespace?: string;
};

export type DetachedSession = {
  id: string;
  podName: string;
  namespace: string;
  containerName: string;
  command?: string[];
  cleanup?: DetachedSessionCleanup;
};

export enum Actions {
  SetCloudShellExpanded = 'setCloudShellExpanded',
  SetCloudShellActive = 'setCloudShellActive',
  SetCloudShellCommand = 'setCloudShellCommand',
  AddDetachedSession = 'addDetachedSession',
  RemoveDetachedSession = 'removeDetachedSession',
  ClearDetachedSessions = 'clearDetachedSessions',
}

export const setCloudShellCommand = (command: string | null) =>
  action(Actions.SetCloudShellCommand, { command });

export const setCloudShellExpanded = (isExpanded: boolean) =>
  action(Actions.SetCloudShellExpanded, { isExpanded });

export const setCloudShellActive = (isActive: boolean) =>
  action(Actions.SetCloudShellActive, { isActive });

export const addDetachedSession = (session: DetachedSession) =>
  action(Actions.AddDetachedSession, session);

export const removeDetachedSession = (id: string) => action(Actions.RemoveDetachedSession, { id });

export const clearDetachedSessions = () => action(Actions.ClearDetachedSessions);

const actions = {
  setCloudShellExpanded,
  setCloudShellActive,
  setCloudShellCommand,
  addDetachedSession,
  removeDetachedSession,
  clearDetachedSessions,
};

export type CloudShellActions = ActionType<typeof actions>;
