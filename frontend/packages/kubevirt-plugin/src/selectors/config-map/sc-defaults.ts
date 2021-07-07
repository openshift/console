import * as _ from 'lodash';
import { ConfigMapKind, StorageClassResourceKind } from '@console/internal/module/k8s';
import { DEFAULT_SC_ANNOTATION } from '../../constants/sc';
import { AccessMode, VolumeMode } from '../../constants/vm/storage';
import { getAnnotations } from '../selectors';

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
  storageClassName?: string,
) => {
  const configMapDefault = getSCConfigMapAttribute(
    storageClassConfigMap,
    storageClassName,
    'volumeMode',
  );

  const volumeMode = configMapDefault ? VolumeMode.fromString(configMapDefault) : null;

  return volumeMode || VolumeMode.FILESYSTEM;
};

export const getDefaultSCAccessModes = (
  storageClassConfigMap: ConfigMapKind,
  storageClassName?: string,
) => {
  const configMapDefault = getSCConfigMapAttribute(
    storageClassConfigMap,
    storageClassName,
    'accessMode',
  );

  const accessMode = configMapDefault ? AccessMode.fromString(configMapDefault) : null;

  return accessMode ? [accessMode] : [AccessMode.READ_WRITE_ONCE];
};

export const isConfigMapContainsScModes = (
  storageClassConfigMap: ConfigMapKind,
  storageClassName?: string,
) =>
  _.has(storageClassConfigMap, ['data', `${storageClassName}.accessMode`]) &&
  _.has(storageClassConfigMap, ['data', `${storageClassName}.volumeMode`]);

export const getDefaultStorageClass = (
  storageClasses: StorageClassResourceKind[],
): StorageClassResourceKind =>
  (storageClasses || []).find((sc) => getAnnotations(sc, {})[DEFAULT_SC_ANNOTATION] === 'true');
