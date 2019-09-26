import * as _ from 'lodash';

export const getVolumePersistentVolumeClaimName = (volume) =>
  _.get(volume, 'persistentVolumeClaim.claimName');
export const getVolumeDataVolumeName = (volume) => _.get(volume, 'dataVolume.name');

export const getVolumeCloudInitUserData = (volume) => _.get(volume, 'cloudInitNoCloud.userData');
