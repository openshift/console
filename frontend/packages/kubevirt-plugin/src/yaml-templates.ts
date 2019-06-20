import { Map as ImmutableMap } from 'immutable';

import { VirtualMachineModel } from './models';

export const yamlTemplates = ImmutableMap().setIn(
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
);
