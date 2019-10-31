import { testName } from '@console/internal-integration-tests/protractor.conf';
import { CloudInitConfig } from './types';
import { STORAGE_CLASS, COMMON_TEMPLATES_VERSION } from './consts';
import { getRandomMacAddress } from './utils';

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

export const basicVMConfig = {
  operatingSystem: 'Red Hat Enterprise Linux 7.6',
  flavor: 'tiny',
  workloadProfile: 'desktop',
  sourceURL: 'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img',
  sourceContainer: 'kubevirt/cirros-registry-disk-demo',
  cloudInitScript: `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}.example.com`,
};

export const networkInterface = {
  name: `nic1-${testName.slice(-5)}`,
  mac: getRandomMacAddress(),
  binding: 'bridge',
  networkDefinition: multusNAD.metadata.name,
};

export const networkBindingMethods = {
  masquerade: 'masquerade',
  bridge: 'bridge',
  sriov: 'sriov',
};

export const rootDisk = {
  name: 'rootdisk',
  size: '1',
  storageClass: `${STORAGE_CLASS}`,
};

export const hddDisk = {
  name: `disk-${testName.slice(-5)}`,
  size: '2',
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
    namespace,
    labels: {
      app: vmName,
      'flavor.template.kubevirt.io/tiny': 'true',
      'os.template.kubevirt.io/rhel7.6': 'true',
      'vm.kubevirt.io/template': `rhel7-desktop-tiny-${COMMON_TEMPLATES_VERSION}`,
      'vm.kubevirt.io/template-namespace': 'openshift',
      'vm.kubevirt.io/template.revision': '1',
      'vm.kubevirt.io/template.version': COMMON_TEMPLATES_VERSION,
      'workload.template.kubevirt.io/desktop': 'true',
    },
  };
  const urlSource = {
    http: {
      url: basicVMConfig.sourceURL,
    },
  };
  const dataVolumeTemplate = {
    metadata: {
      name: `${metadata.name}-rootdisk`,
    },
    spec: {
      pvc: {
        accessModes: ['ReadWriteMany'],
        volumeMode: 'Block',
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
