import * as _ from 'lodash';

import { winToolsContainerNames } from '../../constants/vm/wintools';

export const getVolumePersistentVolumeClaimName = (volume) =>
  _.get(volume, 'persistentVolumeClaim.claimName');
export const getVolumeDataVolumeName = (volume) => _.get(volume, 'dataVolume.name');

export const getVolumeCloudInitNoCloud = (volume) => volume && volume.cloudInitNoCloud;

export const getVolumeContainerImage = (volume) =>
  volume && volume.containerDisk && volume.containerDisk.image;

export const isWinToolsImage = (image) => {
  const containerNames = winToolsContainerNames();
  return Object.values(containerNames).find((winTool) => image && image.startsWith(winTool));
};
