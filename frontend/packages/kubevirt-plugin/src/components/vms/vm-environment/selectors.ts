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
  Patch,
  TemplateKind,
} from '@console/internal/module/k8s';
import { V1Disk } from 'packages/kubevirt-plugin/src/types/vm/disk/V1Disk';
import { getVolumeWithSourceName } from '../../../selectors/vm';
import { VMKind } from '../../../types/vm';
import { PatchBuilder } from '@console/shared/src/k8s/patch';
import { getTemplateValidationsFromTemplate } from '../../../selectors/vm-template/selectors';
import { getDisks } from '../../../selectors/vm/selectors';
import { BUS_VIRTIO } from '../../../constants/vm/constants';

export const getSerial = (ed: EnvDisk): string => ed[0];
export const getEnvVarSource = (ed: EnvDisk): EnvVarSource => ed[1];

export const getSourceName = (source): string =>
  source?.configMapRef?.name || source?.secretRef?.name || source?.serviceAccountRef?.name || '';

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

export const getSerialNumber = () =>
  getRandomChars(10)
    .concat(getRandomChars(6))
    .toLocaleUpperCase();

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

export const getEnvDiskSerial = (vm: VMKind, sourceName: string) => {
  const vol: V1Volume = getVolumeWithSourceName(vm, sourceName);
  if (!vol) {
    return null;
  }

  const disk = getDisks(vm).find((d) => d.name === vol.name);
  return disk?.serial;
};

export const getVMEnvDiskPatches = (
  vmObj: VMKind,
  sourceName: string,
  sourceKind: string,
  serialNumber: string,
  vmTemplate?: TemplateKind,
): Patch[] => {
  if (!vmObj || !sourceName || !sourceKind) {
    return null;
  }

  const diskBus = vmTemplate
    ? getTemplateValidationsFromTemplate(vmTemplate)
        .getDefaultBus()
        .getValue()
    : BUS_VIRTIO;

  const sourceDiskName = getNewDiskName(sourceName);
  const newDisk = setNewSourceDisk(sourceDiskName, serialNumber, diskBus);
  const newVolume: V1Volume = setNewSourceVolume(sourceKind, sourceName, sourceDiskName);

  const patches = [
    new PatchBuilder('/spec/template/spec/domain/devices/disks/-').add(newDisk).build(),
    new PatchBuilder('/spec/template/spec/volumes/-').add(newVolume).build(),
  ];

  return patches;
};
