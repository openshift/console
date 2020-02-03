import * as _ from 'lodash';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { PVC_ACCESSMODE_DEFAULT, PVC_VOLUMEMODE_DEFAULT } from '../../constants/pvc';

const getSCConfigMapAttribute = (
  storageClassConfigMap: ConfigMapKind,
  storageClassName: string,
  attributeName: string,
  defaultValue: string,
): string => {
  const hasSubAttribute =
    storageClassName &&
    attributeName &&
    _.has(storageClassConfigMap, ['data', `${storageClassName}.${attributeName}`]);
  return _.get(
    storageClassConfigMap,
    ['data', hasSubAttribute ? `${storageClassName}.${attributeName}` : attributeName],
    defaultValue,
  );
};

export const getDefaultSCVolumeMode = (
  storageClassConfigMap: ConfigMapKind,
  storageClassName: string,
) =>
  getSCConfigMapAttribute(
    storageClassConfigMap,
    storageClassName,
    'volumeMode',
    PVC_VOLUMEMODE_DEFAULT,
  );

const getDefaultSCAccessMode = (storageClassConfigMap: ConfigMapKind, storageClassName: string) =>
  getSCConfigMapAttribute(
    storageClassConfigMap,
    storageClassName,
    'accessMode',
    PVC_ACCESSMODE_DEFAULT,
  );

export const getDefaultSCAccessModes = (
  storageClassConfigMap: ConfigMapKind,
  storageClassName: string,
) => {
  const defaultMode = getDefaultSCAccessMode(storageClassConfigMap, storageClassName);
  return defaultMode ? [defaultMode] : [];
};
