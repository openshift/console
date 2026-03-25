import type { Action } from '@console/dynamic-plugin-sdk';

export type ActionObject<T extends readonly PropertyKey[]> = {
  [K in T[number]]: Action;
};

export enum CommonActionCreator {
  Delete = 'Delete',
  Edit = 'Edit',
  ModifyLabels = 'ModifyLabels',
  ModifyAnnotations = 'ModifyAnnotations',
  ModifyCount = 'ModifyCount',
  ModifyPodSelector = 'ModifyPodSelector',
  ModifyTolerations = 'ModifyTolerations',
  ModifyTaints = 'ModifyTaints',
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

export enum PVCActionCreator {
  ExpandPVC = 'ExpandPVC',
  PVCSnapshot = 'PVCSnapshot',
  ClonePVC = 'ClonePVC',
  DeletePVC = 'DeletePVC',
  ModifyVAC = 'ModifyVAC',
}

export enum VolumeSnapshotActionCreator {
  RestorePVC = 'RestorePVC',
}

export enum BuildActionCreator {
  CloneBuild = 'CloneBuild',
  CancelBuild = 'CancelBuild',
}

export enum ReplicaSetActionCreator {
  RollbackDeploymentAction = 'RollbackDeploymentAction',
}

export enum JobActionCreator {
  ModifyJobParallelism = 'ModifyJobParallelism',
}

export enum ReplicationControllerActionCreator {
  RollbackDeploymentConfig = 'RollbackDeploymentConfig',
  CancelRollout = 'CancelRollout',
}

export enum BindingActionCreator {
  DuplicateBinding = 'DuplicateBinding',
  EditBindingSubject = 'EditBindingSubject',
  DeleteBindingSubject = 'DeleteBindingSubject',
  ImpersonateBindingSubject = 'ImpersonateBindingSubject',
}

export enum PDBActionCreator {
  AddPDB = 'AddPDB',
  EditPDB = 'EditPDB',
  DeletePDB = 'DeletePDB',
}

export enum MachineSetActionCreator {
  EditMachineCount = 'EditMachineCount',
  CreateMachineAutoscaler = 'CreateMachineAutoscaler',
}

export enum BuildConfigActionCreator {
  StartBuild = 'StartBuild',
  StartLastRun = 'StartLastRun',
}

export enum CronJobActionCreator {
  StartJob = 'StartJob',
}
