/* eslint-disable no-undef */
import { testName } from '../../protractor.conf';

const testLabel = 'automatedTestName';

export const testVM = {
  apiVersion: 'kubevirt.io/v1alpha2',
  kind: 'VirtualMachine',
  metadata: {
    name: `vm-${testName}`,
    namespace: testName,
    labels: {[testLabel]: testName},
  },
  spec: {
    running: false,
    template: {
      spec: {
        domain: {
          cpu: {
            cores: 1,
          },
          devices: {
            disks: [
              {
                bootOrder: 1,
                disk: {
                  bus: 'virtio',
                },
                name: 'rootdisk',
                volumeName: 'rootdisk',
              },
            ],
            interfaces: [
              {
                bridge: {},
                name: 'eth0',
              },
            ],
          },
          resources: {
            requests: {
              memory: '1G',
            },
          },
        },
        networks: [
          {
            name: 'eth0',
            pod: {},
          },
        ],
        volumes: [
          {
            containerDisk: {
              image: 'kubevirt/cirros-registry-disk-demo:latest',
            },
            name: 'rootdisk',
          },
        ],
      },
    },
  },
};
