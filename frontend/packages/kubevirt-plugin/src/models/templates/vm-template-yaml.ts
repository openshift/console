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
    flavor.template.kubevirt.io/small: 'true'
    os.template.kubevirt.io/fedora31: "true"
    vm.kubevirt.io/template-namespace: openshift
    workload.template.kubevirt.io/server: 'true'
    template.kubevirt.io/version: devel
  annotations:
    name.os.template.kubevirt.io/fedora31: Fedora 31
    openshift.io/provider-display-name: KubeVirt
objects:
  - apiVersion: kubevirt.io/v1alpha3
    kind: VirtualMachine
    metadata:
      labels:
        app: '\${NAME}'
        vm.kubevirt.io/template.revision: '1'
        vm.kubevirt.io/template: fedora-server-small
      name: '\${NAME}'
    spec:
      running: false
      template:
        metadata:
          creationTimestamp: null
          labels:
            kubevirt.io/domain: '\${NAME}'
            kubevirt.io/size: small
        spec:
          domain:
            cpu:
              cores: 1
              sockets: 1
              threads: 1
            devices:
              disks:
                - name: rootdisk
                  bootOrder: 1
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
                memory: 2G
          hostname: '\${NAME}'
          networks:
            - name: nic0
              pod: {}
          terminationGracePeriodSeconds: 0
          volumes:
            - containerDisk:
                image: fedora:latest
              name: rootdisk
            - cloudInitNoCloud:
              userData: |-
                #cloud-config
                password: fedora
                chpasswd: { expire: False }
              name: cloudinitvolume
    status: {}
parameters:
  - name: NAME
    description: Name for the new VM
`,
);
