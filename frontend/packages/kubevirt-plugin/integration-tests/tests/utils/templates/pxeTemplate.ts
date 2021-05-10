export const pxeTemplate = {
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
    name: 'pxe-template',
    namespace: 'myproject',
  },
  objects: [
    {
      apiVersion: 'kubevirt.io/v1',
      kind: 'VirtualMachine',
      metadata: {
        annotations: {
          'kubevirt.ui/firstBoot': 'true',
          'kubevirt.ui/pxeInterface': 'eth1',
        },
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
                interfaces: [
                  {
                    bridge: {},
                    name: 'eth0',
                  },
                  {
                    bootOrder: 1,
                    bridge: {},
                    name: 'eth1',
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
              {
                multus: {
                  networkName: 'pxe-net-conf',
                },
                name: 'eth1',
              },
            ],
            terminationGracePeriodSeconds: 0,
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
