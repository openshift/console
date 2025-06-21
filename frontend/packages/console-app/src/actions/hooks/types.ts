export enum PVCActionCreator {
  ExpandPVC = 'ExpandPVC',
  PVCSnapshot = 'PVCSnapshot',
  ClonePVC = 'ClonePVC',
  DeletePVC = 'DeletePVC',
}

export enum VolumeSnapshotActionCreator {
  RestorePVC = 'RestorePVC',
}
