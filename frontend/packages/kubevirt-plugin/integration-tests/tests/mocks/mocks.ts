import { testName } from '@console/internal-integration-tests/protractor.conf';
import { ConfigMapKind, SecretKind, ServiceAccountKind } from '@console/internal/module/k8s';

import { CloudInitConfig, Disk } from '../types/types';
import {
  COMMON_TEMPLATES_NAMESPACE,
  COMMON_TEMPLATES_REVISION,
  KUBEVIRT_PROJECT_NAME,
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  STORAGE_CLASS,
} from '../utils/constants/common';
import { ProvisionSource } from '../utils/constants/enums/provisionSource';
import {
  DISK_DRIVE,
  DISK_INTERFACE,
  DISK_SOURCE,
  diskAccessMode,
  diskVolumeMode,
  NIC_MODEL,
  NIC_TYPE,
} from '../utils/constants/vm';
import { Flavor } from '../utils/constants/wizard';
import {
  deepFreeze,
  getRandomMacAddress,
  getResourceObject,
  resolveStorageDataAttribute,
} from '../utils/utils';

export const flavorConfigs = {
  [Flavor.TINY]: { flavor: Flavor.TINY },
  [Flavor.SMALL]: { flavor: Flavor.SMALL },
  [Flavor.MEDIUM]: { flavor: Flavor.MEDIUM },
  [Flavor.LARGE]: { flavor: Flavor.LARGE },
  [Flavor.CUSTOM]: { flavor: Flavor.CUSTOM, cpu: '2', memory: '2Gi' },
};
deepFreeze(flavorConfigs);

export const multusNAD = {
  apiVersion: 'k8s.cni.cncf.io/v1',
  kind: 'NetworkAttachmentDefinition',
  metadata: {
    name: `multus-${testName}`,
    namespace: testName,
    labels: { automatedTest: testName },
  },
  spec: {
    config: '{ "cniVersion": "0.3.1", "type": "cnv-bridge", "bridge": "testbridge", "ipam": {} }',
  },
};
deepFreeze(multusNAD);

export const dataVolumeManifest = ({ name, namespace, sourceURL, accessMode, volumeMode }) => {
  return {
    apiVersion: 'cdi.kubevirt.io/v1beta1',
    kind: 'DataVolume',
    metadata: {
      name,
      namespace,
      annotations: {
        'cdi.kubevirt.io/storage.bind.immediate.requested': 'true',
      },
    },
    spec: {
      pvc: {
        accessModes: [accessMode],
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
        volumeMode,
        storageClassName: STORAGE_CLASS,
      },
      source: {
        http: {
          url: sourceURL,
        },
      },
    },
  };
};

export const kubevirtStorage = getResourceObject(
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  KUBEVIRT_PROJECT_NAME,
  'configMap',
);

export const AccessMode = resolveStorageDataAttribute(kubevirtStorage, 'accessMode');
export const VolumeMode = resolveStorageDataAttribute(kubevirtStorage, 'volumeMode');

export const getTestDataVolume = (name?: string, namespace?: string) => {
  return dataVolumeManifest({
    name: name || `testdv-${testName}`,
    namespace: namespace || testName,
    sourceURL: ProvisionSource.URL.getSource(),
    accessMode: AccessMode,
    volumeMode: VolumeMode,
  });
};

export const getDiskToCloneFrom = (): Disk => {
  const testDV = getTestDataVolume();
  return {
    name: testDV.metadata.name,
    size: testDV.spec.pvc.resources.requests.storage.slice(0, -2),
    drive: DISK_DRIVE.Disk,
    interface: DISK_INTERFACE.VirtIO,
    bootable: true,
    storageClass: testDV.spec.pvc.storageClassName,
    sourceConfig: {
      PVCName: testDV.metadata.name,
      PVCNamespace: testName,
    },
    source: DISK_SOURCE.AttachClonedDisk,
  };
};

export const cloudInitScript = `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}`;

export const defaultPodNetworkingInterface = {
  name: 'default',
  mac: '-',
  model: NIC_MODEL.VirtIO,
  type: NIC_TYPE.masquerade,
  network: 'Pod Networking',
};
deepFreeze(defaultPodNetworkingInterface);

export const multusNetworkInterface = {
  name: `nic1-${testName.slice(-5)}`,
  model: NIC_MODEL.VirtIO,
  mac: getRandomMacAddress(),
  type: NIC_TYPE.bridge,
  network: multusNAD.metadata.name,
};
deepFreeze(multusNetworkInterface);

export const rootDisk: Disk = {
  name: 'rootdisk',
  size: '1',
  drive: DISK_DRIVE.Disk,
  bootable: true,
  interface: DISK_INTERFACE.VirtIO,
  storageClass: `${STORAGE_CLASS}`,
};
deepFreeze(rootDisk);

export const rwxRootDisk = {
  name: 'rootdisk',
  size: '1',
  drive: DISK_DRIVE.Disk,
  interface: DISK_INTERFACE.VirtIO,
  storageClass: `${STORAGE_CLASS}`,
  advanced: {
    accessMode: diskAccessMode.ReadWriteMany.value,
    volumeMode: diskVolumeMode.Block,
  },
};
deepFreeze(rwxRootDisk);

export const containerRootDisk: Disk = {
  name: 'rootdisk',
  drive: DISK_DRIVE.Disk,
  bootable: true,
  interface: DISK_INTERFACE.VirtIO,
};
deepFreeze(containerRootDisk);

export const cdGuestTools: Disk = {
  source: DISK_SOURCE.Container,
  interface: DISK_INTERFACE.sata,
  size: '10',
  drive: DISK_DRIVE.CDROM,
  storageClass: `${STORAGE_CLASS}`,
  sourceConfig: {
    container: ProvisionSource.CONTAINER.getSource(),
  },
};
deepFreeze(cdGuestTools);

export const hddDisk: Disk = {
  name: `disk-${testName.slice(-5)}`,
  size: '1',
  drive: DISK_DRIVE.Disk,
  interface: DISK_INTERFACE.VirtIO,
  storageClass: `${STORAGE_CLASS}`,
};
deepFreeze(hddDisk);

export const cloudInitCustomScriptConfig: CloudInitConfig = {
  useCustomScript: true,
  customScript: cloudInitScript,
};
deepFreeze(cloudInitCustomScriptConfig);

export const getConfigMap = (namespace: string, name: string): ConfigMapKind => {
  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    data: {
      data1: 'value1',
      data2: 'value2',
      data3: 'value3',
    },
    metadata: {
      name,
      namespace,
    },
  };
};

export const getSecret = (namespace: string, name: string): SecretKind => {
  return {
    apiVersion: 'v1',
    kind: 'Secret',
    data: {
      password: 'MWYyZDFlMmU2N2Rm',
      username: 'YWRtaW4=',
    },
    metadata: {
      name,
      namespace,
    },
    type: 'Opaque',
  };
};

export const getServiceAccount = (namespace: string, name: string): ServiceAccountKind => {
  return {
    apiVersion: 'v1',
    kind: 'ServiceAccount',
    metadata: {
      name,
      namespace,
    },
  };
};

function getMetadata(
  provisionSource: ProvisionSource,
  namespace: string,
  name?: string,
  cloudinit?: string,
  finalizers?: [string],
  addSnapshotEnabledVolume?: boolean,
) {
  const vmName = name || `${provisionSource.getValue().toLowerCase()}-${namespace.slice(-5)}`;
  const metadata = {
    name: vmName,
    annotations: {
      'name.os.template.kubevirt.io/rhel7.8': 'Red Hat Enterprise Linux 7.0 or higher',
      description: namespace,
    },
    finalizers,
    namespace,
    labels: {
      app: vmName,
      'flavor.template.kubevirt.io/tiny': 'true',
      'os.template.kubevirt.io/rhel7.8': 'true',
      'vm.kubevirt.io/template.namespace': COMMON_TEMPLATES_NAMESPACE,
      'vm.kubevirt.io/template.revision': COMMON_TEMPLATES_REVISION,
      'workload.template.kubevirt.io/desktop': 'true',
    },
  };
  const urlSource = {
    http: {
      url: ProvisionSource.URL.getSource(),
    },
  };
  const dataVolumeTemplate = {
    apiVersion: 'cdi.kubevirt.io/v1beta1',
    metadata: {
      name: `${metadata.name}-rootdisk`,
    },
    spec: {
      pvc: {
        accessModes: [AccessMode],
        volumeMode: VolumeMode,
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
        storageClassName: `${rootDisk.storageClass}`,
      },
      source: {},
    },
  };
  const snapshotEnabledDVTemplate = {
    apiVersion: 'cdi.kubevirt.io/v1beta1',
    metadata: {
      name: `${metadata.name}-snapshot-disk`,
    },
    spec: {
      pvc: {
        accessModes: [diskAccessMode.ReadWriteMany.value],
        volumeMode: diskVolumeMode.Block,
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
        storageClassName: `${STORAGE_CLASS}`,
      },
      source: {
        image: ProvisionSource.CONTAINER.getSource(),
      },
    },
  };
  const dataVolume = {
    dataVolume: {
      name: `${metadata.name}-rootdisk`,
    },
    name: 'rootdisk',
  };
  const snapshotEnabledDV = {
    dataVolume: {
      name: `${metadata.name}-snapshot-disk`,
    },
    name: 'snapshot-disk',
  };
  const containerDisk = {
    containerDisk: {
      image: ProvisionSource.CONTAINER.getSource(),
    },
    name: 'rootdisk',
  };
  const cloudInitNoCloud = {
    cloudInitNoCloud: {
      userData: cloudinit,
    },
    name: 'cloudinitdisk',
  };
  const rootdisk = {
    bootOrder: 1,
    disk: {
      bus: 'virtio',
    },
    name: 'rootdisk',
  };
  const snapshotEnabledDisk = {
    bootOrder: 4,
    disk: {
      bus: 'virtio',
    },
    name: 'snapshot-disk',
  };
  const cloudinitdisk = {
    bootOrder: 3,
    disk: {
      bus: 'virtio',
    },
    name: 'cloudinitdisk',
  };

  const dataVolumeTemplates = [];
  const volumes = [];
  const disks = [];

  disks.push(rootdisk);

  if (cloudinit) {
    volumes.push(cloudInitNoCloud);
    disks.push(cloudinitdisk);
  }

  if (addSnapshotEnabledVolume) {
    disks.push(snapshotEnabledDisk);
    dataVolumeTemplates.push(snapshotEnabledDVTemplate);
    volumes.push(snapshotEnabledDV);
  }

  switch (provisionSource) {
    case ProvisionSource.URL:
      dataVolumeTemplate.spec.source = urlSource;
      dataVolumeTemplates.push(dataVolumeTemplate);
      volumes.push(dataVolume);
      break;
    case ProvisionSource.PXE:
      dataVolumeTemplate.spec.source = { blank: {} };
      dataVolumeTemplates.push(dataVolumeTemplate);
      volumes.push(dataVolume);
      break;
    case ProvisionSource.CONTAINER:
      volumes.push(containerDisk);
      break;
    default:
      throw Error('Provision source not Implemented');
  }

  const vmiSpec = {
    domain: {
      cpu: {
        cores: 1,
        sockets: 1,
        threads: 1,
      },
      devices: {
        disks,
        inputs: [
          {
            bus: 'virtio',
            name: 'tablet',
            type: 'tablet',
          },
        ],
        interfaces: [
          {
            bootOrder: 2,
            masquerade: {},
            name: 'nic-0',
            model: 'virtio',
          },
        ],
        rng: {},
      },
      resources: {
        requests: {
          memory: '1073741824',
        },
      },
    },
    evictionStrategy: 'LiveMigrate',
    terminationGracePeriodSeconds: 0,
    networks: [
      {
        name: 'nic-0',
        pod: {},
      },
    ],
    volumes,
  };

  return {
    metadata,
    dataVolumeTemplates,
    vmiSpec,
  };
}

export function getVMIManifest(
  provisionSource: ProvisionSource,
  namespace: string,
  name?: string,
  cloudinit?: string,
) {
  const { metadata, vmiSpec } = getMetadata(provisionSource, namespace, name, cloudinit);

  const vmiResource = {
    apiVersion: 'kubevirt.io/v1',
    kind: 'VirtualMachineInstance',
    metadata,
    spec: vmiSpec,
  };

  return vmiResource;
}

export function getVMManifest(
  provisionSource: ProvisionSource,
  namespace: string,
  name?: string,
  cloudinit?: string,
  addSnapshotEnabledVolume?: boolean,
) {
  const { metadata, dataVolumeTemplates, vmiSpec } = getMetadata(
    provisionSource,
    namespace,
    name,
    cloudinit,
    null,
    addSnapshotEnabledVolume,
  );

  const vmResource = {
    apiVersion: 'kubevirt.io/v1',
    kind: 'VirtualMachine',
    metadata,
    spec: {
      dataVolumeTemplates,
      running: false,
      template: {
        metadata: {
          labels: {
            'flavor.template.kubevirt.io/tiny': 'true',
            'kubevirt.io/domain': metadata.name,
            'kubevirt.io/size': Flavor.TINY,
            'vm.kubevirt.io/name': metadata.name,
          },
        },
        spec: vmiSpec,
      },
    },
  };

  return vmResource;
}

export const datavolumeClonerClusterRole = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name: 'datavolume-cloner',
  },
  rules: [
    {
      apiGroups: ['cdi.kubevirt.io'],
      resources: ['datavolumes/source'],
      verbs: ['*'],
    },
  ],
};
deepFreeze(datavolumeClonerClusterRole);

export const v2vUIDeployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: `v2v-vmware`,
    namespace: testName,
  },
};
deepFreeze(v2vUIDeployment);
