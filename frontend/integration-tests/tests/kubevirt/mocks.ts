/* eslint-disable no-undef */
import { testName } from '../../protractor.conf';

export const emptyStr = '---';

export function getVmManifest(provisionSource: string, namespace: string, name?: string, cloudinit?: string) {
  const metadata = {
    name: name ? name : `${provisionSource.toLowerCase()}-${namespace.slice(-5)}`,
    annotations: {
      'name.os.template.kubevirt.io/rhel7.0': 'Red Hat Enterprise Linux 7.0',
      description: namespace,
    },
    namespace,
    labels: {
      'app': `vm-${provisionSource.toLowerCase()}-${namespace}`,
      'flavor.template.kubevirt.io/small': 'true',
      'os.template.kubevirt.io/rhel7.0': 'true',
      'vm.kubevirt.io/template': 'rhel7-generic-small',
      'vm.kubevirt.io/template-namespace': 'openshift',
      'workload.template.kubevirt.io/generic': 'true',
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
                memory: '2G',
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

export const multusNad = {
  apiVersion: 'k8s.cni.cncf.io/v1',
  kind: 'NetworkAttachmentDefinition',
  metadata: {
    name: `multus-${testName}`,
    namespace: testName,
    labels: {['automatedTest']: testName},
  },
  spec: {
    config: '{ "cniVersion": "0.3.1", "type": "bridge", "bridge": "testbridge", "ipam": {} }',
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
      'ReadWriteOnce',
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

export const basicVmConfig = {
  operatingSystem: 'Red Hat Enterprise Linux 7.0',
  flavor: 'small',
  workloadProfile: 'generic',
  sourceURL: 'https://download.cirros-cloud.net/0.4.0/cirros-0.4.0-x86_64-disk.img',
  sourceContainer: 'kubevirt/cirros-registry-disk-demo:latest',
  cloudInitScript: `#cloud-config\nuser: cloud-user\npassword: atomic\nchpasswd: {expire: False}\nhostname: vm-${testName}.example.com`,
};

export const windowsVmConfig = {
  operatingSystem: 'Microsoft Windows Server 2012 R2',
  flavor: 'medium',
  workloadProfile: 'generic',
  sourceURL: `http://${process.env.SERVER_IP}:${process.env.SERVER_PORT}/images/windows2012R2/disk.img`,
};

export const networkInterface = {
  podNicName: 'nic0',
  name: `nic1-${testName.slice(-5)}`,
  mac: 'fe:fe:fe:fe:fe:fe',
  binding: 'bridge',
  networkDefinition: testNad.metadata.name,
};

export const multusNetworkInterface = {
  name: `multus-nic-${testName.slice(-5)}`,
  mac: 'fa:fa:fa:fe:fe:01',
  binding: 'bridge',
  networkDefinition: multusNad.metadata.name,
};

export const networkBindingMethod = {
  masquerade: 'masquerade',
  bridge: 'bridge',
  sriov: 'sriov',
};

export const networkWizardTabCol = {
  name: 0,
  mac: 1,
  networkDefinition: 2,
  binding: 3,
};

export const networkTabCol = {
  name: 1,
  mode: 2,
  networkDefinition: 3,
  binding: 4,
  mac: 5,
};

export const diskWizardTabCol = {
  name: 1,
  size: 2,
  storageclass: 3,
};

export const diskTabCol = {
  name: 1,
  size: 2,
  interface: 3,
  storageclass: 4,
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

export const localStorageDisk = {
  name: `local-storage-${testName.slice(-5)}`,
  size: '15',
  storageClass: `${localStorageClass.metadata.name}`,
};

export const cloudInitCustomScriptConfig = {
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
    template.kubevirt.ui: openshift_rhel7-generic-small
    vm.kubevirt.io/template: rhel7-generic-small
    workload.template.kubevirt.io/generic: 'true'
spec:
  dataVolumeTemplates:
    - metadata:
        name: testdisk-testcnv
      spec:
        pvc:
          accessModes:
            - ReadWriteOnce
          resources:
            requests:
              storage: 1Gi
          storageClassName: hdd
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
            memory: 2G
      networks:
        - name: nic0
          pod: {}
        - multus:
            networkName: ovs-net-1-${testName}
          name: nic1
      terminationGracePeriodSeconds: 0
      volumes:
        - containerDisk:
            image: 'kubevirt/cirros-container-disk-demo:latest'
          name: rootdisk
        - dataVolume:
            name: testdisk-testcnv
          name: testdisk`;
