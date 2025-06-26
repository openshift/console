import { Action } from '@console/dynamic-plugin-sdk';

export enum DeploymentActionCreator {
  EditDeployment = 'EditDeployment',
  UpdateStrategy = 'UpdateStrategy',
  PauseRollout = 'PauseRollout',
  RestartRollout = 'RestartRollout',
  StartDCRollout = 'StartDCRollout',
  EditResourceLimits = 'EditResourceLimits',
}

export type ActionObject<T extends readonly PropertyKey[]> = {
  [K in T[number]]: Action;
};
