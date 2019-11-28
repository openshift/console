import { OrderedMap } from 'immutable';
import {
  basicVMConfig,
  networkInterface,
  rootDisk,
  hddDisk,
  dataVolumeManifest,
} from './utils/mocks';
import { StorageResource, ProvisionConfig } from './utils/types';
import {
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  KUBEVIRT_PROJECT_NAME,
  DISK_INTERFACE,
  CONFIG_NAME_URL,
  CONFIG_NAME_PXE,
  CONFIG_NAME_CONTAINER,
  CONFIG_NAME_DISK,
  DISK_SOURCE,
} from './utils/consts';
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
    size: testDV.spec.pvc.resources.requests.storage.slice(0, -2),
    interface: DISK_INTERFACE.VirtIO,
    storageClass: testDV.spec.pvc.storageClassName,
    sourceConfig: {
      PVCName: testDV.metadata.name,
      PVCNamespace: testName,
    },
    source: DISK_SOURCE.AttachClonedDisk,
  };
};

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
    .set(CONFIG_NAME_DISK, {
      provision: {
        method: CONFIG_NAME_DISK,
      },
      networkResources: [networkInterface],
      storageResources: [getDiskToCloneFrom(testName)],
    });
