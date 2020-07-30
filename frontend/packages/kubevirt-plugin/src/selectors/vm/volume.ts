import * as _ from 'lodash';
import { WINTOOLS_CONTAINER_NAMES } from '../../constants';

export const getVolumePersistentVolumeClaimName = (volume) =>
  _.get(volume, 'persistentVolumeClaim.claimName');
export const getVolumeDataVolumeName = (volume) => _.get(volume, 'dataVolume.name');

export const getVolumeCloudInitNoCloud = (volume) => volume && volume.cloudInitNoCloud;

export const getVolumeContainerImage = (volume) =>
  volume && volume.containerDisk && volume.containerDisk.image;

export const isWinToolsImage = (image) =>
  Object.values(WINTOOLS_CONTAINER_NAMES).find((winTool) => image && image.startsWith(winTool));
