import { testName } from '@console/internal-integration-tests/protractor.conf';
import { SIZE_UNITS, STORAGE_CLASS_PATTERNS } from '../utils/consts';

export const testDeployment = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'example',
    namespace: testName,
  },
  spec: {
    selector: {
      matchLabels: {
        app: 'hello-openshift',
      },
    },
    replicas: 1,
    template: {
      metadata: {
        labels: {
          app: 'hello-openshift',
        },
      },
      spec: {
        volumes: [
          {
            name: `${testName}-pvc`,
            persistentVolumeClaim: {
              claimName: `${testName}-pvc`,
            },
          },
        ],
        containers: [
          {
            name: 'hello-openshift',
            image: 'openshift/hello-openshift',
            ports: [
              {
                containerPort: 8080,
              },
            ],
            volumeMounts: [
              {
                name: `${testName}-pvc`,
                mountPath: '/data',
              },
            ],
          },
        ],
      },
    },
  },
};

export const testDeploymentRbd = {
  apiVersion: 'apps/v1',
  kind: 'Deployment',
  metadata: {
    name: 'example2',
    namespace: testName,
  },
  spec: {
    selector: {
      matchLabels: {
        app: 'hello-openshift',
      },
    },
    replicas: 1,
    template: {
      metadata: {
        labels: {
          app: 'hello-openshift',
        },
      },
      spec: {
        volumes: [
          {
            name: `${testName}-rbdpvc`,
            persistentVolumeClaim: {
              claimName: `${testName}-rbdpvc`,
            },
          },
        ],
        containers: [
          {
            name: 'my-container',
            image: 'nginx',
            securityContext: {
              capabilities: {
                add: ['SYS_ADMIN'],
              },
            },
            volumeDevices: [
              {
                name: `${testName}-rbdpvc`,
                devicePath: '/dev/rbdblock',
              },
            ],
          },
        ],
      },
    },
  },
};

export const testPVC = {
  name: `${testName}-pvc`,
  namespace: testName,
  size: '5',
  sizeUnits: SIZE_UNITS.MI,
  storageClass: STORAGE_CLASS_PATTERNS.FS,
};

export const testRbdPVC = {
  name: `${testName}-rbdpvc`,
  namespace: testName,
  size: '5',
  sizeUnits: SIZE_UNITS.MI,
  storageClass: STORAGE_CLASS_PATTERNS.RBD,
};
