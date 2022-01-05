import { action } from 'typesafe-actions';

enum ActionType {
  SetCreateProjectMessage = 'setCreateProjectMessage',
  SetClusterID = 'setClusterID',
}

export const setClusterID = (clusterID: string) => action(ActionType.SetClusterID, { clusterID });
export const setCreateProjectMessage = (message: string) =>
  action(ActionType.SetCreateProjectMessage, { message });
