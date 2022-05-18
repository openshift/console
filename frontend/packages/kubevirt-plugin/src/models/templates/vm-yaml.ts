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
    os.template.kubevirt.io/fedora35: 'true'
    flavor.template.kubevirt.io/small: 'true'
    vm.kubevirt.io/template: fedora-server-small
    workload.template.kubevirt.io/server: 'true'
  annotations:
    name.os.template.kubevirt.io/fedora35: Fedora 35
    description: VM example
spec:
  running: false
  template:
    metadata:
      annotations:
        vm.kubevirt.io/flavor: small
        vm.kubevirt.io/os: fedora
        vm.kubevirt.io/workload: server
      labels:
        flavor.template.kubevirt.io/small: 'true'
        kubevirt.io/domain: vm-example
        kubevirt.io/size: small
        vm.kubevirt.io/name: vm-example
        os.template.kubevirt.io/fedora35: 'true'
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
              model: virtio
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
            image: 'quay.io/containerdisks/fedora:35'
          name: containerdisk
        - cloudInitNoCloud:
            userData: |-
              #cloud-config
              password: fedora
              chpasswd: { expire: False }
          name: cloudinitdisk
`,
);

export const defaultVMYamlTemplate = VirtualMachineYAMLTemplates.getIn(['default']);
