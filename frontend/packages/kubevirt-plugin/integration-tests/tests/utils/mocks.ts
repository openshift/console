import { testName } from '@console/internal-integration-tests/protractor.conf';
import { CloudInitConfig, BaseVMConfig, StorageResource } from './types';
import {
  STORAGE_CLASS,
  commonTemplateVersion,
  NIC_MODEL,
  NIC_TYPE,
  DISK_INTERFACE,
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  KUBEVIRT_PROJECT_NAME,
  COMMON_TEMPLATES_NAMESPACE,
  COMMON_TEMPLATES_REVISION,
  DISK_SOURCE,
} from './consts';
import { getRandomMacAddress, getResourceObject, resolveStorageDataAttribute } from './utils';
import { Flavor, OperatingSystem, WorkloadProfile } from './constants/wizard';
import { ConfigMapKind, SecretKind, ServiceAccountKind } from '@console/internal/module/k8s/types';

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

export const dataVolumeManifest = ({ name, namespace, sourceURL, accessMode, volumeMode }) => {
  return {
    apiVersion: 'cdi.kubevirt.io/v1alpha1',
    kind: 'DataVolume',
    metadata: {
      name,
      namespace,
    },
    spec: {
      pvc: {
        accessModes: [accessMode],
        dataSource: null,
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

export const basicVMConfig: BaseVMConfig = {
  operatingSystem: OperatingSystem.RHEL7,
  flavorConfig: { flavor: Flavor.TINY },
  workloadProfile: WorkloadProfile.DESKTOP,
  sourceURL:
    'http://cnv-qe-server.rhevdev.lab.eng.rdu2.redhat.com/files/files-https/cirros/cirros-qcow2.img',
  sourceContainer: 'kubevirt/fedora-cloud-container-disk-demo',
  cloudInitScript: `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}`,
};
Object.freeze(basicVMConfig.flavorConfig);
Object.freeze(basicVMConfig);

export const defaultWizardPodNetworkingInterface = {
  name: 'nic-0',
  mac: '-',
  model: NIC_MODEL.VirtIO,
  type: NIC_TYPE.masquerade,
  network: 'Pod Networking',
};

export const defaultYAMLPodNetworkingInterface = {
  name: 'default',
  mac: '-',
  model: NIC_MODEL.VirtIO,
  type: NIC_TYPE.masquerade,
  network: 'Pod Networking',
};

// Fake windows machine, still cirros in the heart
export const windowsVMConfig: BaseVMConfig = {
  operatingSystem: OperatingSystem.WINDOWS_10,
  flavorConfig: { flavor: Flavor.MEDIUM },
  workloadProfile: WorkloadProfile.DESKTOP,
  sourceURL:
    'http://cnv-qe-server.rhevdev.lab.eng.rdu2.redhat.com/files/files-https/cirros/cirros-qcow2.img',
  sourceContainer: 'kubevirt/cirros-registry-disk-demo',
  cloudInitScript: `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}`, // reusing cirros
};

export const multusNetworkInterface = {
  name: `nic1-${testName.slice(-5)}`,
  model: NIC_MODEL.VirtIO,
  mac: getRandomMacAddress(),
  type: NIC_TYPE.bridge,
  network: multusNAD.metadata.name,
};

export const rootDisk: StorageResource = {
  name: 'rootdisk',
  size: '1',
  interface: DISK_INTERFACE.VirtIO,
  storageClass: `${STORAGE_CLASS}`,
};

export const cdGuestTools: StorageResource = {
  source: DISK_SOURCE.Container,
  interface: DISK_INTERFACE.sata,
  storageClass: `${STORAGE_CLASS}`,
  sourceConfig: {
    container: 'kubevirt/virtio-container-disk',
  },
};

export const hddDisk: StorageResource = {
  name: `disk-${testName.slice(-5)}`,
  size: '1',
  interface: DISK_INTERFACE.VirtIO,
  storageClass: `${STORAGE_CLASS}`,
};

export const cloudInitCustomScriptConfig: CloudInitConfig = {
  useCloudInit: true,
  useCustomScript: true,
  customScript: basicVMConfig.cloudInitScript,
};

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
  provisionSource: 'URL' | 'PXE' | 'Container',
  namespace: string,
  name?: string,
  cloudinit?: string,
  finalizers?: [string],
) {
  const vmName = name || `${provisionSource.toLowerCase()}-${namespace.slice(-5)}`;
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
      'vm.kubevirt.io/template': `rhel7-desktop-${basicVMConfig.flavorConfig.flavor.toLowerCase()}-${commonTemplateVersion()}`,
      'vm.kubevirt.io/template.namespace': COMMON_TEMPLATES_NAMESPACE,
      'vm.kubevirt.io/template.revision': COMMON_TEMPLATES_REVISION,
      'vm.kubevirt.io/template.version': commonTemplateVersion(),
      'workload.template.kubevirt.io/desktop': 'true',
    },
  };
  const urlSource = {
    http: {
      url: basicVMConfig.sourceURL,
    },
  };
  const kubevirtStorage = getResourceObject(
    KUBEVIRT_STORAGE_CLASS_DEFAULTS,
    KUBEVIRT_PROJECT_NAME,
    'configMap',
  );
  const dataVolumeTemplate = {
    metadata: {
      name: `${metadata.name}-rootdisk`,
    },
    spec: {
      pvc: {
        accessModes: [resolveStorageDataAttribute(kubevirtStorage, 'accessMode')],
        volumeMode: resolveStorageDataAttribute(kubevirtStorage, 'volumeMode'),
        dataSource: null,
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
  const dataVolume = {
    dataVolume: {
      name: `${metadata.name}-rootdisk`,
    },
    name: 'rootdisk',
  };
  const containerDisk = {
    containerDisk: {
      image: basicVMConfig.sourceContainer,
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

  switch (provisionSource) {
    case 'URL':
      dataVolumeTemplate.spec.source = urlSource;
      dataVolumeTemplates.push(dataVolumeTemplate);
      volumes.push(dataVolume);
      break;
    case 'PXE':
      dataVolumeTemplate.spec.source = { blank: {} };
      dataVolumeTemplates.push(dataVolumeTemplate);
      volumes.push(dataVolume);
      break;
    case 'Container':
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
  provisionSource: 'URL' | 'PXE' | 'Container',
  namespace: string,
  name?: string,
  cloudinit?: string,
) {
  const { metadata, vmiSpec } = getMetadata(provisionSource, namespace, name, cloudinit);

  const vmiResource = {
    apiVersion: 'kubevirt.io/v1alpha3',
    kind: 'VirtualMachineInstance',
    metadata,
    spec: vmiSpec,
  };

  return vmiResource;
}

export function getVMManifest(
  provisionSource: 'URL' | 'PXE' | 'Container',
  namespace: string,
  name?: string,
  cloudinit?: string,
) {
  const { metadata, dataVolumeTemplates, vmiSpec } = getMetadata(
    provisionSource,
    namespace,
    name,
    cloudinit,
  );

  const vmResource = {
    apiVersion: 'kubevirt.io/v1alpha3',
    kind: 'VirtualMachine',
    metadata,
    spec: {
      dataVolumeTemplates,
      running: false,
      template: {
        metadata: {
          labels: {
            'kubevirt.io/domain': metadata.name,
            'kubevirt.io/size': basicVMConfig.flavorConfig.flavor,
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
