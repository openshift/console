import * as k8sModels from '../models';

export const vmYamlTemplate = `
  apiVersion: ${k8sModels.VirtualMachineModel.apiGroup}/${k8sModels.VirtualMachineModel.apiVersion}
  kind: VirtualMachine
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
`;
