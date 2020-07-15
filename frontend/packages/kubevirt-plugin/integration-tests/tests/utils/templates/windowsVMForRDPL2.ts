import {
  COMMON_TEMPLATES_NAMESPACE,
  COMMON_TEMPLATES_REVISION,
  commonTemplateVersion,
} from '../constants/common';

export const getWindowsVM = ({ name, networkName, vmIP }) => `
apiVersion: kubevirt.io/v1alpha3
kind: VirtualMachine
metadata:
  annotations:
    kubevirt.io/latest-observed-api-version: v1alpha3
    kubevirt.io/storage-observed-api-version: v1alpha3
    name.os.template.kubevirt.io/win2k16: Microsoft Windows Server 2016
  name: ${name}
  labels:
    app: ${name}
    os.template.kubevirt.io/win2k16: 'true'
    vm.kubevirt.io/template: win2k12r2-server-large-${commonTemplateVersion()}
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
        kubevirt.io/size: large
        os.template.kubevirt.io/win2k16: 'true'
        vm.kubevirt.io/name: ${name}
        workload.template.kubevirt.io/server: 'true'
    spec:
      domain:
        clock:
          timer:
            hpet:
              present: false
            hyperv: {}
            pit:
              tickPolicy: delay
            rtc:
              tickPolicy: catchup
          utc: {}
        cpu:
          cores: 1
          sockets: 1
          threads: 1
        devices:
          disks:
            - bootOrder: 1
              disk:
                bus: sata
              name: rootdisk
            - disk:
                bus: sata
              name: cloudinitdisk
            - cdrom:
                bus: sata
              name: windows-guest-tools
          inputs:
            - bus: usb
              name: tablet
              type: tablet
          interfaces:
            - masquerade: {}
              model: virtio
              name: nic-0
            - bridge: {}
              model: virtio
              name: nic-1

        features:
          acpi: {}
          apic: {}
          hyperv:
            relaxed: {}
            spinlocks:
              spinlocks: 8191
            vapic: {}
        machine:
          type: q35
        resources:
          requests:
            memory: 1Gi
      hostname: ${name}
      networks:
        - name: nic-0
          pod: {}
        - multus:
            networkName: ${networkName}
          name: nic-1
      terminationGracePeriodSeconds: 0
      volumes:
        - containerDisk:
            image: 'kubevirt/fedora-cloud-registry-disk-demo:latest'
          name: rootdisk
        - containerDisk:
            image: kubevirt/virtio-container-disk
          name: windows-guest-tools
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
status: {}
`;
