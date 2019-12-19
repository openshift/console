import { testName } from '@console/internal-integration-tests/protractor.conf';
import { CloudInitConfig, BaseVMConfig } from './types';
import {
  STORAGE_CLASS,
  COMMON_TEMPLATES_VERSION,
  NIC_MODEL,
  NIC_TYPE,
  DISK_INTERFACE,
  KUBEVIRT_STORAGE_CLASS_DEFAULTS,
  KUBEVIRT_PROJECT_NAME,
  COMMON_TEMPLATES_NAMESPACE,
  COMMON_TEMPLATES_REVISION,
} from './consts';
import { getRandomMacAddress, getResourceObject, resolveStorageDataAttribute } from './utils';
import { Flavor, OperatingSystem, WorkloadProfile } from './constants/wizard';

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
  operatingSystem: OperatingSystem.RHEL7_6,
  flavor: Flavor.TINY,
  workloadProfile: WorkloadProfile.DESKTOP,
  sourceURL: 'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img',
  sourceContainer: 'kubevirt/cirros-registry-disk-demo',
  cloudInitScript: `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}`,
};

export const defaultWizardPodNetworkingInterface = {
  name: 'nic0',
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
export const widowsVMConfig: BaseVMConfig = {
  operatingSystem: OperatingSystem.WINDOWS_10,
  flavor: Flavor.MEDIUM,
  workloadProfile: WorkloadProfile.DESKTOP,
  sourceURL: 'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img',
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

export const rootDisk = {
  name: 'rootdisk',
  size: '1',
  interface: DISK_INTERFACE.VirtIO,
  storageClass: `${STORAGE_CLASS}`,
};

export const hddDisk = {
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

export function getVMManifest(
  provisionSource: string,
  namespace: string,
  name?: string,
  cloudinit?: string,
) {
  const vmName = name || `${provisionSource.toLowerCase()}-${namespace.slice(-5)}`;
  const metadata = {
    name: vmName,
    annotations: {
      'name.os.template.kubevirt.io/rhel7.6': 'Red Hat Enterprise Linux 7.6',
      description: namespace,
    },
    finalizers: ['k8s.v1.cni.cncf.io/kubeMacPool'],
    namespace,
    labels: {
      app: vmName,
      'flavor.template.kubevirt.io/tiny': 'true',
      'os.template.kubevirt.io/rhel7.6': 'true',
      'vm.kubevirt.io/template': `rhel7-desktop-tiny-${COMMON_TEMPLATES_VERSION}`,
      'vm.kubevirt.io/template-namespace': COMMON_TEMPLATES_NAMESPACE,
      'vm.kubevirt.io/template.revision': COMMON_TEMPLATES_REVISION,
      'vm.kubevirt.io/template.version': COMMON_TEMPLATES_VERSION,
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
            'kubevirt.io/size': 'tiny',
            'vm.kubevirt.io/name': metadata.name,
          },
        },
        spec: {
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
                  name: 'nic0',
                  model: 'virtio',
                },
              ],
              rng: {},
            },
            resources: {
              requests: {
                memory: '1G',
              },
            },
          },
          evictionStrategy: 'LiveMigrate',
          terminationGracePeriodSeconds: 0,
          networks: [
            {
              name: 'nic0',
              pod: {},
            },
          ],
          volumes,
        },
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
