import { Action } from '@console/dynamic-plugin-sdk';

export enum CommonActionCreator {
  Delete = 'Delete',
  Edit = 'Edit',
  ModifyLabels = 'ModifyLabels',
  ModifyAnnotations = 'ModifyAnnotations',
  ModifyCount = 'ModifyCount',
  ModifyPodSelector = 'ModifyPodSelector',
  ModifyTolerations = 'ModifyTolerations',
  AddStorage = 'AddStorage',
}

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
export enum PVCActionCreator {
  ExpandPVC = 'ExpandPVC',
  PVCSnapshot = 'PVCSnapshot',
  ClonePVC = 'ClonePVC',
  DeletePVC = 'DeletePVC',
}

export enum VolumeSnapshotActionCreator {
  RestorePVC = 'RestorePVC',
}
