/* eslint-disable no-undef */
import { testName } from '../../../protractor.conf';
// eslint-disable-next-line no-unused-vars
import { cloudInitConfig } from './types';
import { STORAGE_CLASS } from './consts';
import { getRandomMacAddress } from './utils';


export const multusNad = {
  apiVersion: 'k8s.cni.cncf.io/v1',
  kind: 'NetworkAttachmentDefinition',
  metadata: {
    name: `multus-${testName}`,
    namespace: testName,
    labels: {['automatedTest']: testName},
  },
  spec: {
    config: '{ "cniVersion": "0.3.1", "type": "cnv-bridge", "bridge": "testbridge", "ipam": {} }',
  },
};

export const localStorageClass = {
  kind: 'StorageClass',
  apiVersion: 'storage.k8s.io/v1',
  metadata: {
    name: `local-storage-${testName}`,
  },
  provisioner: 'kubernetes.io/no-provisioner',
  reclaimPolicy: 'Delete',
  volumeBindingMode: 'WaitForFirstConsumer',
};

export const localStoragePersistentVolume = {
  kind: 'PersistentVolume',
  apiVersion: 'v1',
  metadata: {
    name: `test-pv-${testName}`,
    finalizers: [
      'kubernetes.io/pv-protection',
    ],
  },
  spec: {
    capacity: {
      storage: '20Gi',
    },
    local: {
      path: '/tmp/mylocalstorage/vol1',
    },
    accessModes: [
      'ReadWriteMany',
    ],
    persistentVolumeReclaimPolicy: 'Retain',
    storageClassName: `${localStorageClass.metadata.name}`,
    volumeMode: 'Filesystem',
    nodeAffinity: {
      required: {
        nodeSelectorTerms: [
          {
            matchExpressions: [
              {
                key: 'kubernetes.io/hostname',
                operator: 'In',
                values: [
                  `${process.env.SLAVE_LABEL}-node1.example.com`,
                ],
              },
            ],
          },
        ],
      },
    },
  },
};

export const dataVolumeManifest = ({name, namespace, sourceURL}) => {
  return {
    apiVersion: 'cdi.kubevirt.io/v1alpha1',
    kind: 'DataVolume',
    metadata: {
      name,
      namespace,
    },
    spec: {
      pvc: {
        accessModes: [
          'ReadWriteMany',
        ],
        dataSource: null,
        resources: {
          requests: {
            storage: '5Gi',
          },
        },
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

export const windowsVmConfig = {
  operatingSystem: 'Microsoft Windows Server 2012 R2',
  flavor: 'medium',
  workloadProfile: 'desktop',
  sourceURL: `http://${process.env.SERVER_IP}:${process.env.SERVER_PORT}/images/windows2012R2/disk.img`,
};

export const networkInterface = {
  name: `nic1-${testName.slice(-5)}`,
  mac: getRandomMacAddress(),
  binding: 'bridge',
  networkDefinition: multusNad.metadata.name,
};

export const multusNetworkInterface = {
  name: `multus-nic-${testName.slice(-5)}`,
  mac: 'fa:fa:fa:fe:fe:01',
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

export const localStorageDisk = {
  name: `local-storage-${testName.slice(-5)}`,
  size: '15',
  storageClass: `${localStorageClass.metadata.name}`,
};

export const cloudInitCustomScriptConfig: cloudInitConfig = {
  useCloudInit: true,
  useCustomScript: true,
  customScript: basicVmConfig.cloudInitScript,
};

export const examplePod = ({name, namespace, nodeSelector}) => {
  return {
    apiVersion: 'v1',
    kind: 'Pod',
    metadata: {
      name,
      labels: {
        app: 'hello-openshift',
      },
      namespace,
    },
    spec: {
      containers: [
        {
          name: 'hello-openshift',
          image: 'openshift/hello-openshift',
          ports: [
            {
              containerPort: 8080,
            },
          ],
        },
      ],
      nodeSelector,
    },
  };
};

export function getVmManifest(provisionSource: string, namespace: string, name?: string, cloudinit?: string) {
  const metadata = {
    name: name ? name : `${provisionSource.toLowerCase()}-${namespace.slice(-5)}`,
    annotations: {
      'name.os.template.kubevirt.io/rhel7.6': 'Red Hat Enterprise Linux 7.6',
      description: namespace,
    },
    namespace,
    labels: {
      'app': `vm-${provisionSource.toLowerCase()}-${namespace}`,
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
        accessModes: [
          'ReadWriteMany',
        ],
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
        spec : {
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

export const customVMWithNicDisk = `
apiVersion: kubevirt.io/v1alpha3
kind: VirtualMachine
metadata:
  annotations:
    name.os.template.kubevirt.io/rhel7.6: Red Hat Enterprise Linux 7.6
  name: vm-${testName}
  namespace: ${testName}
  labels:
    flavor.template.kubevirt.io/small: 'true'
    os.template.kubevirt.io/rhel7.6: 'true'
    template.kubevirt.ui: openshift_rhel7-desktop-small
    vm.kubevirt.io/template: rhel7-desktop-small
    workload.template.kubevirt.io/desktop: 'true'
spec:
  dataVolumeTemplates:
    - metadata:
        name: testdisk-testcnv
      spec:
        pvc:
          accessModes:
            - ReadWriteMany
          resources:
            requests:
              storage: 1Gi
          storageClassName: ${STORAGE_CLASS}
        source:
          blank: {}
  running: false
  template:
    metadata:
      labels:
        vm.kubevirt.io/name: testcnv
    spec:
      domain:
        cpu:
          cores: 1
          sockets: 1
          threads: 1
        devices:
          disks:
            - bootOrder: 1
              disk:
                bus: virtio
              name: rootdisk
            - disk:
                bus: virtio
              name: testdisk
          interfaces:
            - bridge: {}
              name: nic0
            - bridge: {}
              name: nic1
          rng: {}
        resources:
          requests:
            memory: 1G
      networks:
        - name: nic0
          pod: {}
        - multus:
            networkName: multus-${testName}
          name: nic1
      terminationGracePeriodSeconds: 0
      volumes:
        - containerDisk:
            image: 'kubevirt/cirros-container-disk-demo:latest'
          name: rootdisk
        - dataVolume:
            name: testdisk-testcnv
          name: testdisk`;
