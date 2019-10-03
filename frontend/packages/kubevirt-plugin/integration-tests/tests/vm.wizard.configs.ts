import { OrderedMap } from 'immutable';
import {
  basicVMConfig,
  networkInterface,
  rootDisk,
  hddDisk,
  dataVolumeManifest,
} from './utils/mocks';
import { StorageResource, ProvisionConfig } from './utils/types';
import { KUBEVIRT_STORAGE_CLASS_DEFAULTS, KUBEVIRT_PROJECT_NAME } from './utils/consts';
import { resolveStorageDataAttribute, getResourceObject } from './utils/utils';

export const vmConfig = (name: string, provisionConfig, testName: string) => {
  const commonSettings = {
    startOnCreation: true,
    cloudInit: {
      useCloudInit: false,
    },
    namespace: testName,
    description: `Default description ${testName}`,
    flavor: basicVMConfig.flavor,
    operatingSystem: basicVMConfig.operatingSystem,
    workloadProfile: basicVMConfig.workloadProfile,
  };

  return {
    ...commonSettings,
    name: `${name}-${testName}`,
    provisionSource: provisionConfig.provision,
    storageResources: provisionConfig.storageResources,
    networkResources: provisionConfig.networkResources,
  };
};

export const kubevirtStorage = getResourceObject(
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  KUBEVIRT_PROJECT_NAME,
  'configMap',
);

export const getTestDataVolume = (testName: string) =>
  dataVolumeManifest({
    name: `toclone-${testName}`,
    namespace: testName,
    sourceURL: basicVMConfig.sourceURL,
    accessMode: resolveStorageDataAttribute(kubevirtStorage, 'accessMode'),
    volumeMode: resolveStorageDataAttribute(kubevirtStorage, 'volumeMode'),
  });

const getDiskToCloneFrom = (testName: string): StorageResource => {
  const testDV = getTestDataVolume(testName);
  return {
    name: testDV.metadata.name,
    size: '1',
    storageClass: testDV.spec.pvc.storageClassName,
    attached: true,
  };
};

export const CONFIG_NAME_URL = 'URL';
export const CONFIG_NAME_CONTAINER = 'Container';
export const CONFIG_NAME_PXE = 'PXE';
export const CONFIG_NAME_CLONED_DISK = 'ClonedDisk';

export const getProvisionConfigs = (testName: string) =>
  OrderedMap<string, ProvisionConfig>()
    .set(CONFIG_NAME_URL, {
      provision: {
        method: CONFIG_NAME_URL,
        source: basicVMConfig.sourceURL,
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk],
    })
    .set(CONFIG_NAME_CONTAINER, {
      provision: {
        method: CONFIG_NAME_CONTAINER,
        source: basicVMConfig.sourceContainer,
      },
      networkResources: [networkInterface],
      storageResources: [hddDisk],
    })
    .set(CONFIG_NAME_PXE, {
      provision: {
        method: CONFIG_NAME_PXE,
      },
      networkResources: [networkInterface],
      storageResources: [rootDisk],
    })
    .set(CONFIG_NAME_CLONED_DISK, {
      provision: {
        method: 'Cloned Disk', // mind the space
      },
      networkResources: [networkInterface],
      storageResources: [getDiskToCloneFrom(testName)],
    });
