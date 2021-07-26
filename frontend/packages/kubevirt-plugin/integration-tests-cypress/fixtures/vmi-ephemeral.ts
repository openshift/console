export default {
  apiVersion: 'kubevirt.io/v1',
  kind: 'VirtualMachineInstance',
  metadata: {
    labels: {
      special: 'vmi-ephemeral',
    },
    name: 'vmi-ephemeral',
    namespace: 'foo',
  },
  spec: {
    domain: {
      devices: {
        disks: [
          {
            disk: {
              bus: 'virtio',
            },
            name: 'containerdisk',
          },
        ],
      },
      machine: {
        type: '',
      },
      resources: {
        requests: {
          memory: '128Mi',
        },
      },
    },
    terminationGracePeriodSeconds: 0,
    volumes: [
      {
        containerDisk: {
          image: 'quay.io/kubevirt/cirros-container-disk-demo:latest',
        },
        name: 'containerdisk',
      },
    ],
  },
};
