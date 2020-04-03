import {
  COMMON_TEMPLATES_NAMESPACE,
  COMMON_TEMPLATES_REVISION,
  commonTemplateVersion,
} from '../consts';

export const getWindowsVM = ({ name, networkName, vmIP }) => `
apiVersion: kubevirt.io/v1alpha3
kind: VirtualMachine
metadata:
  annotations:
    kubevirt.io/latest-observed-api-version: v1alpha3
    kubevirt.io/storage-observed-api-version: v1alpha3
    name.os.template.kubevirt.io/win10: Microsoft Windows 10
  name: ${name}
  finalizers:
    - k8s.v1.cni.cncf.io/kubeMacPool
  labels:
    app: fake-windows
    flavor.template.kubevirt.io/medium: 'true'
    os.template.kubevirt.io/win10: 'true'
    vm.kubevirt.io/template: win2k12r2-server-medium-${commonTemplateVersion()}
    vm.kubevirt.io/template.namespace: ${COMMON_TEMPLATES_NAMESPACE}
    vm.kubevirt.io/template.revision: '${COMMON_TEMPLATES_REVISION}'
    vm.kubevirt.io/template.version: ${commonTemplateVersion()}
    workload.template.kubevirt.io/server: 'true'
spec:
  running: true
  template:
    metadata:
      creationTimestamp: null
      labels:
        kubevirt.io/domain: ${name}
        kubevirt.io/size: medium
        vm.kubevirt.io/name: ${name}
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
              name: rootdisk
            - disk:
                bus: virtio
              name: cloudinitdisk
          interfaces:
            - masquerade: {}
              model: virtio
              name: nic0
            - bridge: {}
              model: virtio
              name: nic1
        machine:
          type: ''
        resources:
          requests:
            memory: 1Gi
      evictionStrategy: LiveMigrate
      hostname: fake-windows
      networks:
        - name: nic0
          pod: {}
        - multus:
            networkName: ${networkName}
          name: nic1
      terminationGracePeriodSeconds: 0
      volumes:
        - containerDisk:
            image: 'kubevirt/fedora-cloud-registry-disk-demo:latest'
          name: rootdisk
        - cloudInitNoCloud:
            userData: |
              #cloud-config
              password: fedora
              chpasswd: { expire: False }
              runcmd:
              - ifconfig eth1 ${vmIP} netmask 255.255.255.0 up
              - dnf install -y qemu-guest-agent
              - systemctl start qemu-guest-agent
          name: cloudinitdisk
`;
