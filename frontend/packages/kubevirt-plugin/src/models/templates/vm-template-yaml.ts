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
    os.template.kubevirt.io/fedora31: 'true'
    workload.template.kubevirt.io/server: 'true'
  annotations:
    name.os.template.kubevirt.io/fedora31: Fedora 31
    description: VM template example
objects:
  - apiVersion: kubevirt.io/v1alpha3
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
                image: 'kubevirt/fedora-cloud-container-disk-demo:latest'
            - cloudInitNoCloud:
                userData: |-
                  #cloud-config
                  password: fedora
                  chpasswd: { expire: False }
              name: cloudinitdisk
          hostname: '\${NAME}'
parameters:
  - name: NAME
    description: Name for the new VM
    required: true
`,
);
