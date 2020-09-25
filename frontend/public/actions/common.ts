import { action } from 'typesafe-actions';

enum ActionType {
  SetCreateProjectMessage = 'setCreateProjectMessage',
  SetClusterID = 'setClusterID',
  SetUser = 'setUser',
}

export const setClusterID = (clusterID: string) => action(ActionType.SetClusterID, { clusterID });
export const setUser = (user: any) => action(ActionType.SetUser, { user });
export const setCreateProjectMessage = (message: string) =>
  action(ActionType.SetCreateProjectMessage, { message });
