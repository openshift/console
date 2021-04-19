import * as _ from 'lodash';

export const getVolumePersistentVolumeClaimName = (volume) =>
  _.get(volume, 'persistentVolumeClaim.claimName');
export const getVolumeDataVolumeName = (volume) => _.get(volume, 'dataVolume.name');

export const getVolumeCloudInitNoCloud = (volume) => volume && volume.cloudInitNoCloud;

export const getVolumeContainerImage = (volume) =>
  volume && volume.containerDisk && volume.containerDisk.image;
