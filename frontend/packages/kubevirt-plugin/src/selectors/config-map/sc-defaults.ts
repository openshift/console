import * as _ from 'lodash';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { AccessMode, VolumeMode } from '../../constants/vm/storage';

const getSCConfigMapAttribute = (
  storageClassConfigMap: ConfigMapKind,
  storageClassName: string,
  attributeName: string,
): string => {
  const hasSubAttribute =
    storageClassName &&
    attributeName &&
    _.has(storageClassConfigMap, ['data', `${storageClassName}.${attributeName}`]);
  return (
    _.get(storageClassConfigMap, [
      'data',
      hasSubAttribute ? `${storageClassName}.${attributeName}` : attributeName,
    ]) || null
  );
};

export const getDefaultSCVolumeMode = (
  storageClassConfigMap: ConfigMapKind,
  storageClassName: string,
) => {
  const configMapDefault = getSCConfigMapAttribute(
    storageClassConfigMap,
    storageClassName,
    'volumeMode',
  );

  const volumeMode = configMapDefault ? VolumeMode.fromString(configMapDefault) : null;

  if (volumeMode) {
    return volumeMode;
  }

  return storageClassName === 'local-sc' ? VolumeMode.FILESYSTEM : VolumeMode.BLOCK;
};

export const getDefaultSCAccessModes = (
  storageClassConfigMap: ConfigMapKind,
  storageClassName: string,
) => {
  const configMapDefault = getSCConfigMapAttribute(
    storageClassConfigMap,
    storageClassName,
    'accessMode',
  );

  const accessMode = configMapDefault ? AccessMode.fromString(configMapDefault) : null;

  if (accessMode) {
    return [accessMode];
  }

  return storageClassName === 'local-sc' ? [AccessMode.SINGLE_USER] : [AccessMode.SHARED_ACCESS];
};
