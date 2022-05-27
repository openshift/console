import { Map as ImmutableMap } from 'immutable';
import { TemplateModel } from '@console/internal/models';

export const VMTemplateYAMLTemplates = ImmutableMap().setIn(
  ['vm-template'],
  `
apiVersion: ${TemplateModel.apiGroup}/${TemplateModel.apiVersion}
kind: ${TemplateModel.kind}
metadata:
  name: vm-template-example
  labels:
    template.kubevirt.io/type: vm
    os.template.kubevirt.io/fedora35: 'true'
    workload.template.kubevirt.io/server: 'true'
  annotations:
    name.os.template.kubevirt.io/fedora35: Fedora 35
    description: VM template example
objects:
  - apiVersion: kubevirt.io/v1
    kind: VirtualMachine
    metadata:
      labels:
        app: '\${NAME}'
      name: '\${NAME}'
    spec:
      running: false
      template:
        metadata:
          labels:
            kubevirt.io/domain: '\${NAME}'
        spec:
          domain:
            cpu:
              cores: 1
              sockets: 1
              threads: 1
            devices:
              disks:
                - name: containerdisk
                  bootOrder: 1
                  disk:
                    bus: virtio
                - disk:
                    bus: virtio
                  name: cloudinitdisk
              interfaces:
                - masquerade: {}
                  name: default
                  model: virtio
              networkInterfaceMultiqueue: true
              rng: {}
            resources:
              requests:
                memory: 1G
          networks:
            - name: default
              pod: {}
          terminationGracePeriodSeconds: 0
          volumes:
            - name: containerdisk
              containerDisk:
                image: 'quay.io/containerdisks/fedora:35'
            - cloudInitNoCloud:
                userData: |-
                  #cloud-config
                  password: '\${CLOUD_USER_PASSWORD}'
                  chpasswd: { expire: False }
              name: cloudinitdisk
          hostname: '\${NAME}'
parameters:
  - name: NAME
    description: Name for the new VM
    required: true
  - password: CLOUD_USER_PASSWORD
    description: Randomized password for the cloud-init user
    generate: expression
    from: '[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}'
`,
);

export const defaultVMTemplateYamlTemplate = VMTemplateYAMLTemplates.getIn(['vm-template']);
