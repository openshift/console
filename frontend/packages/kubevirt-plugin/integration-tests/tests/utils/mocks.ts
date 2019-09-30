import { testName } from '../../../../../integration-tests/protractor.conf';
import { CloudInitConfig } from './types';
import { STORAGE_CLASS } from './consts';
import { getRandomMacAddress } from './utils';

export const multusNad = {
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
            storage: '5Gi',
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

export const basicVmConfig = {
  operatingSystem: 'Red Hat Enterprise Linux 7.6',
  flavor: 'tiny',
  workloadProfile: 'desktop',
  sourceURL: 'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img',
  sourceContainer: 'kubevirt/cirros-registry-disk-demo:latest',
  cloudInitScript: `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}.example.com`,
};

export const networkInterface = {
  name: `nic1-${testName.slice(-5)}`,
  mac: getRandomMacAddress(),
  binding: 'bridge',
  networkDefinition: multusNad.metadata.name,
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
  customScript: basicVmConfig.cloudInitScript,
};

export function getVmManifest(
  provisionSource: string,
  namespace: string,
  name?: string,
  cloudinit?: string,
) {
  const metadata = {
    name: name || `${provisionSource.toLowerCase()}-${namespace.slice(-5)}`,
    annotations: {
      'name.os.template.kubevirt.io/rhel7.6': 'Red Hat Enterprise Linux 7.6',
      description: namespace,
    },
    namespace,
    labels: {
      app: `vm-${provisionSource.toLowerCase()}-${namespace}`,
      'flavor.template.kubevirt.io/tiny': 'true',
      'os.template.kubevirt.io/rhel7.6': 'true',
      'vm.kubevirt.io/template': 'rhel7-desktop-tiny',
      'vm.kubevirt.io/template-namespace': 'openshift',
      'workload.template.kubevirt.io/desktop': 'true',
    },
  };
  const urlSource = {
    http: {
      url: 'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img',
    },
  };
  const dataVolumeTemplate = {
    metadata: {
      name: `${metadata.name}-rootdisk`,
    },
    spec: {
      pvc: {
        accessModes: ['ReadWriteMany'],
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
      image: 'kubevirt/cirros-registry-disk-demo:latest',
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
