export const containerTemplate = {
  apiVersion: 'template.openshift.io/v1',
  kind: 'Template',
  metadata: {
    labels: {
      'flavor.template.kubevirt.io/small': 'true',
      'os.template.kubevirt.io/fedora29': 'true',
      'template.kubevirt.io/type': 'vm',
      'vm.kubevirt.io/template': 'fedora-generic',
      'vm.kubevirt.io/template.namespace': 'default',
      'workload.template.kubevirt.io/generic': 'true',
    },
    annotations: {
      'name.os.template.kubevirt.io/fedora29': 'Fedora 29',
    },
    name: 'container-template',
    namespace: 'myproject',
  },
  objects: [
    {
      apiVersion: 'kubevirt.io/v1',
      kind: 'VirtualMachine',
      metadata: {
        // eslint-disable-next-line no-template-curly-in-string
        name: '${NAME}',
      },
      spec: {
        template: {
          spec: {
            domain: {
              cpu: {
                cores: 2,
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
                rng: {},
              },
              resources: {
                requests: {
                  memory: '2G',
                },
              },
            },
            networks: [
              {
                name: 'eth0',
                pod: {},
              },
            ],
            terminationGracePeriodSeconds: 0,
            volumes: [
              {
                name: 'rootdisk',
                containerDisk: {
                  image: 'fooContainer',
                },
              },
            ],
          },
        },
      },
    },
  ],
  parameters: [
    {
      description: 'Name for the new VM',
      name: 'NAME',
    },
  ],
};
