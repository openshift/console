import { OrderedMap } from 'immutable';
import { testName } from '@console/internal-integration-tests/protractor.conf';
import {
  basicVMConfig,
  multusNetworkInterface,
  rootDisk,
  hddDisk,
  dataVolumeManifest,
} from './utils/mocks';
import { StorageResource, ProvisionConfig } from './utils/types';
import {
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  KUBEVIRT_PROJECT_NAME,
  DISK_INTERFACE,
  DISK_SOURCE,
} from './utils/consts';
import { resolveStorageDataAttribute, getResourceObject } from './utils/utils';
import { ProvisionConfigName } from './utils/constants/wizard';

export const vmConfig = (name: string, namespace: string, provisionConfig: ProvisionConfig) => {
  const commonSettings = {
    startOnCreation: true,
    cloudInit: {
      useCloudInit: false,
    },
    namespace,
    description: `Default description ${namespace}`,
    flavor: basicVMConfig.flavor,
    operatingSystem: basicVMConfig.operatingSystem,
    workloadProfile: basicVMConfig.workloadProfile,
  };

  return {
    ...commonSettings,
    name: `${name}-${namespace}`,
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

export const getTestDataVolume = () =>
  dataVolumeManifest({
    name: `toclone-${testName}`,
    namespace: testName,
    sourceURL: basicVMConfig.sourceURL,
    accessMode: resolveStorageDataAttribute(kubevirtStorage, 'accessMode'),
    volumeMode: resolveStorageDataAttribute(kubevirtStorage, 'volumeMode'),
  });

const getDiskToCloneFrom = (): StorageResource => {
  const testDV = getTestDataVolume();
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

export const getProvisionConfigs = () =>
  OrderedMap<ProvisionConfigName, ProvisionConfig>()
    .set(ProvisionConfigName.URL, {
      provision: {
        method: ProvisionConfigName.URL,
        source: basicVMConfig.sourceURL,
      },
      networkResources: [multusNetworkInterface],
      storageResources: [rootDisk],
    })
    .set(ProvisionConfigName.CONTAINER, {
      provision: {
        method: ProvisionConfigName.CONTAINER,
        source: basicVMConfig.sourceContainer,
      },
      networkResources: [multusNetworkInterface],
      storageResources: [hddDisk],
    })
    .set(ProvisionConfigName.PXE, {
      provision: {
        method: ProvisionConfigName.PXE,
      },
      networkResources: [multusNetworkInterface],
      storageResources: [rootDisk],
    })
    .set(ProvisionConfigName.DISK, {
      provision: {
        method: ProvisionConfigName.DISK,
      },
      networkResources: [multusNetworkInterface],
      storageResources: [getDiskToCloneFrom()],
    });
