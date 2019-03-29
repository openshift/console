/* eslint-disable no-undef */
import { testName } from '../../protractor.conf';

export function getVmManifest(provisionSource: string, namespace: string, name?: string) {
  const metadata = {
    name: name ? name : `${provisionSource.toLowerCase()}-${namespace.slice(-5)}`,
    annotations: {
      'name.os.template.cnv.io/centos7.0': 'CentOS 7.0',
      description: namespace,
    },
    namespace,
    labels: {
      'app': `vm-${provisionSource.toLowerCase()}-${namespace}`,
      'flavor.template.cnv.io/Custom': 'true',
      'os.template.cnv.io/centos7.0': 'true',
      'vm.cnv.io/template': 'centos7-generic-medium',
      'vm.cnv.io/template-namespace': 'openshift',
      'workload.template.cnv.io/generic': 'true',
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
        accessModes: [
          'ReadWriteOnce',
        ],
        resources: {
          requests: {
            storage: '1Gi',
          },
        },
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

  const dataVolumeTemplates = [];
  const volumes = [];

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
            'vm.cnv.io/name': metadata.name,
          },
        },
        spec : {
          domain: {
            cpu: {
              cores: 1,
              sockets: 1,
              threads: 1,
            },
            devices: {
              disks: [
                {
                  bootOrder: 1,
                  disk: {
                    bus: 'virtio',
                  },
                  name: 'rootdisk',
                },
              ],
              interfaces: [
                {
                  bridge: {},
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

export const testNad = {
  apiVersion: 'k8s.cni.cncf.io/v1',
  kind: 'NetworkAttachmentDefinition',
  metadata: {
    name: `ovs-net-1-${testName}`,
    namespace: testName,
    labels: {['automatedTest']: testName},
  },
  spec: {
    config: '{ "cniVersion": "0.3.1", "type": "ovs", "bridge": "br0" }',
  },
};

export const basicVmConfig = {
  operatingSystem: 'Red Hat Enterprise Linux 7.6',
  flavor: 'small',
  workloadProfile: 'generic',
  sourceURL: 'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img',
  sourceContainer: 'kubevirt/cirros-registry-disk-demo:latest',
  cloudInitScript: '#cloud-config\nuser: username\npassword: atomic\nchpasswd: {expire: False}',
};

export const networkInterface = {
  name: `nic1-${testName.slice(-5)}`,
  mac: 'fe:fe:fe:fe:fe:fe',
  networkDefinition: testNad.metadata.name,
};

export const hddDisk = {
  name: `hdd-${testName.slice(-5)}`,
  size: '2',
  StorageClass: 'hdd',
};

export const glusterfsDisk = {
  name: `glusterfs-${testName.slice(-5)}`,
  size: '1',
  StorageClass: 'glusterfs-storage',
};

export const cloudInitCustomScriptConfig = {
  useCustomScript: true,
  customScript: basicVmConfig.cloudInitScript,
};
