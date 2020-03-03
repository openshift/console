import { Map as ImmutableMap } from 'immutable';
import { VirtualMachineModel } from '..';

export const VirtualMachineYAMLTemplates = ImmutableMap().setIn(
  ['default'],
  `
apiVersion: ${VirtualMachineModel.apiGroup}/${VirtualMachineModel.apiVersion}
kind: ${VirtualMachineModel.kind}
metadata:
  labels:
    app: example
    flavor.template.kubevirt.io/tiny: 'true'
    os.template.kubevirt.io/fedora31: 'true'
    vm.kubevirt.io/template.revision: '1'
    vm.kubevirt.io/template.version: v0.8.1
    workload.template.kubevirt.io/server: 'true'
  name: example
spec:
  running: false
  template:
    metadata:
      labels:
        kubevirt.io/domain: example
        kubevirt.io/size: tiny
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
            - name: cloudinitdisk
              disk:
                bus: virtio
          interfaces:
            - bootOrder: 2
              masquerade: {}
              model: virtio
              name: nic0
          rng: {}
        resources:
          requests:
            memory: 1G
      hostname: example
      networks:
        - name: nic0
          pod: {}
      volumes:
      - containerDisk:
          image: docker.io/kubevirt/fedora-cloud-container-disk-demo:latest
        name: containerdisk
      - cloudInitNoCloud:
          userData: |-
            #cloud-config
            password: fedora
            chpasswd: { expire: False }
        name: cloudinitdisk
`,
);
