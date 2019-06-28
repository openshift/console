import { Map as ImmutableMap } from 'immutable';

import { TemplateModel } from '@console/internal/models';
import { VirtualMachineModel } from './models';

export const yamlTemplates = ImmutableMap()
  .setIn(
    [VirtualMachineModel, 'default'],
    `
apiVersion: ${VirtualMachineModel.apiGroup}/${VirtualMachineModel.apiVersion}
kind: ${VirtualMachineModel.kind}
metadata:
  name: example
spec:
  running: false
  template:
    spec:
      domain:
        devices:
          disks:
            - name: containerdisk
              disk:
                bus: virtio
            - name: cloudinitdisk
              disk:
                bus: virtio
          interfaces:
          - name: default
            bridge: {}
        resources:
          requests:
            memory: 64M
      networks:
      - name: default
        pod: {}
      volumes:
        - name: containerdisk
          containerDisk:
            image: kubevirt/cirros-registry-disk-demo
        - name: cloudinitdisk
          cloudInitNoCloud:
            userDataBase64: SGkuXG4=
`,
  )
  .setIn(
    [TemplateModel, 'vm-template'],
    `
apiVersion: ${TemplateModel.apiGroup}/${TemplateModel.apiVersion}
kind: ${TemplateModel.kind}
metadata:
  name: vm-template-example
  labels:
    kubevirt.io/os: fedora27
    miq.github.io/kubevirt-is-vm-template: 'true'
    template.kubevirt.io/type: vm
  annotations:
    description: VM template example
    iconClass: icon-fedora
    tags: 'kubevirt,ocp,template,linux,virtualmachine'
objects:
  - apiVersion: kubevirt.io/v1alpha3
    kind: VirtualMachine
    metadata:
      creationTimestamp: null
      labels:
        kubevirt-vm: 'vm-\${NAME}'
        kubevirt.io/os: fedora27
      name: '\${NAME}'
    spec:
      running: false
      template:
        metadata:
          creationTimestamp: null
          labels:
            kubevirt-vm: 'vm-\${NAME}'
            kubevirt.io/os: fedora27
        spec:
          domain:
            cpu:
              cores: '\${CPU_CORES}'
            devices:
              disks:
                - disk:
                    bus: virtio
                  name: containerdisk
                - disk:
                    bus: virtio
                  name: cloudinitdisk
            machine:
              type: ''
            resources:
              requests:
                memory: '\${MEMORY}'
          terminationGracePeriodSeconds: 0
          volumes:
            - containerDisk:
                image: 'registry:5000/kubevirt/fedora-cloud-container-disk-demo:devel'
              name: containerdisk
            - cloudInitNoCloud:
                userData: |-
                  #cloud-config
                  password: fedora
                  chpasswd: { expire: False }
              name: cloudinitdisk
    status: {}
parameters:
  - name: NAME
    description: Name for the new VM
  - name: MEMORY
    description: Amount of memory
    value: 4096Mi
  - name: CPU_CORES
    description: Amount of cores
    value: '4'
`,
  );
