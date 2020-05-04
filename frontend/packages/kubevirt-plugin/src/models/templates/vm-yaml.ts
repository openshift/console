import { Map as ImmutableMap } from 'immutable';
import { VirtualMachineModel } from '..';

export const VirtualMachineYAMLTemplates = ImmutableMap().setIn(
  ['default'],
  `
apiVersion: ${VirtualMachineModel.apiGroup}/${VirtualMachineModel.apiVersion}
kind: ${VirtualMachineModel.kind}
metadata:
  name: vm-example
  labels:
    app: vm-example
    os.template.kubevirt.io/fedora31: 'true'
    workload.template.kubevirt.io/server: 'true'
  annotations:
    name.os.template.kubevirt.io/fedora31: Fedora 31
    description: VM example
spec:
  running: false
  template:
    metadata:
      labels:
        kubevirt.io/domain: vm-example
        vm.kubevirt.io/name: vm-example
        os.template.kubevirt.io/fedora31: 'true'
        workload.template.kubevirt.io/server: 'true'
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
              name: containerdisk
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
      hostname: vm-example
      networks:
        - name: default
          pod: {}
      terminationGracePeriodSeconds: 0
      volumes:
        - containerDisk:
            image: 'kubevirt/fedora-cloud-container-disk-demo:latest'
          name: containerdisk
        - cloudInitNoCloud:
            userData: |-
              #cloud-config
              password: fedora
              chpasswd: { expire: False }
          name: cloudinitdisk
`,
);
