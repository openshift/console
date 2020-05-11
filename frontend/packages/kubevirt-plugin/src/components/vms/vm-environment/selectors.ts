import * as _ from 'lodash';
import { SOURCES, EnvDisk } from './types';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import {
  configMapKind,
  configMapRef,
  secretRef,
  secretKind,
  serviceAccountRef,
  serviceAccountKind,
} from './constants';
import { getRandomChars } from '@console/shared';
import {
  EnvVarSource,
  ListKind,
  ConfigMapKind,
  SecretKind,
  ServiceAccountKind,
} from '@console/internal/module/k8s';
import { V1Disk } from 'packages/kubevirt-plugin/src/types/vm/disk/V1Disk';

export const getSerial = (ed: EnvDisk): string => ed[0];
export const getEnvVarSource = (ed: EnvDisk): EnvVarSource => ed[1];

export const getSourceName = (ed: EnvDisk): string => {
  const source = getEnvVarSource(ed);
  return (
    source?.configMapRef?.name || source?.secretRef?.name || source?.serviceAccountRef?.name || ''
  );
};

export const getEnvDiskRefKind = (envDisk: EnvDisk) =>
  getEnvVarSource(envDisk) && Object.keys(getEnvVarSource(envDisk))[0];

export const getSourceKind = (envDisk: EnvDisk): string => {
  switch (getEnvDiskRefKind(envDisk)) {
    case configMapRef:
      return configMapKind;
    case secretRef:
      return secretKind;
    case serviceAccountRef:
      return serviceAccountKind;
    default:
      return null;
  }
};

export const getNewDiskName = (sourceName: string) => `${sourceName}-${getRandomChars(6)}-disk`;

export const areEnvDisksEqual = (envDisk1: EnvDisk, envDisk2: EnvDisk): boolean => {
  if (!envDisk1 && !envDisk2) {
    return true;
  }
  if (!envDisk1 || !envDisk2) {
    return false;
  }

  return (
    getSerial(envDisk1) === getSerial(envDisk2) &&
    _.isEqual(getEnvVarSource(envDisk1), getEnvVarSource(envDisk2))
  );
};

export const toListObj = (
  kind: string,
  items,
): ListKind<ConfigMapKind | SecretKind | ServiceAccountKind> => {
  return {
    apiVersion: 'v1',
    kind,
    metadata: {},
    items,
  };
};

export const getAvailableSources = (allSources, usedSources) =>
  allSources.filter(
    (src) =>
      !usedSources.find(
        (ed) => getEnvVarSource(ed)[getEnvDiskRefKind(ed)].name === src.metadata.name,
      ),
  );

export const getNewEnvVarSource = (kind: string, name: string): EnvVarSource => {
  if (!kind || !name) {
    return null;
  }

  switch (kind) {
    case SOURCES.configMapKind:
      return { configMapRef: { name } };
    case SOURCES.secretKind:
      return { secretRef: { name } };
    case SOURCES.serviceAccountKind:
      return { serviceAccountRef: { name } };
    default:
      return null;
  }
};

export const setNewSourceDisk = (diskName: string, serial: string, diskBus: string): V1Disk => {
  return {
    disk: { bus: diskBus },
    name: diskName,
    serial,
  };
};

const setNewconfigMapVolume = (sourceName: string, diskName: string): V1Volume => {
  return {
    configMap: { name: sourceName },
    name: diskName,
  };
};

const setNewSecretVolume = (sourceName: string, diskName: string): V1Volume => {
  return {
    secret: { secretName: sourceName },
    name: diskName,
  };
};

const setNewServiceAccountVolume = (sourceName: string, diskName: string): V1Volume => {
  return {
    serviceAccount: { serviceAccountName: sourceName },
    name: diskName,
  };
};

export const setNewSourceVolume = (
  volKind: string,
  sourceName: string,
  diskName: string,
): V1Volume => {
  switch (volKind) {
    case 'configMap':
      return setNewconfigMapVolume(sourceName, diskName);
    case 'secret':
      return setNewSecretVolume(sourceName, diskName);
    case 'serviceAccount':
      return setNewServiceAccountVolume(sourceName, diskName);
    default:
      return null;
  }
};

export const areThereDupSerials = (serials: string[]): boolean => {
  return serials.length !== new Set(serials).size;
};
