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
export enum PVCActionCreator {
  ExpandPVC = 'ExpandPVC',
  PVCSnapshot = 'PVCSnapshot',
  ClonePVC = 'ClonePVC',
  DeletePVC = 'DeletePVC',
}

export enum VolumeSnapshotActionCreator {
  RestorePVC = 'RestorePVC',
}
