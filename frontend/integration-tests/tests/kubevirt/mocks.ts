/* eslint-disable no-undef */
import { testName } from '../../protractor.conf';

const testLabel = 'automatedTestName';

export const testVM = {
  apiVersion: 'kubevirt.io/v1alpha3',
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

export const testNAD = {
  apiVersion: 'k8s.cni.cncf.io/v1',
  kind: 'NetworkAttachmentDefinition',
  metadata: {
    name: `ovs-net-1${testName}-${testName}`,
    namespace: testName,
    labels: {[testLabel]: testName},
  },
  spec: {
    config: '{ "cniVersion": "0.3.1", "type": "ovs", "bridge": "br0" }',
  },
};
