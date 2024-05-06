import { action } from 'typesafe-actions';
import { ActionType } from './ui';

export const setClusterID = (clusterID: string) => action(ActionType.SetClusterID, { clusterID });
export const setCreateProjectMessage = (message: string) =>
  action(ActionType.SetCreateProjectMessage, { message });
