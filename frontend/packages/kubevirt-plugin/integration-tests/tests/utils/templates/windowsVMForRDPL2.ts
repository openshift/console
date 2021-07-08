import { testName } from '@console/internal-integration-tests/protractor.conf';
import { COMMON_TEMPLATES_NAMESPACE, COMMON_TEMPLATES_REVISION } from '../constants/common';

export const getFakeWindowsVM = ({ name, networkName, vmIP }) => `
apiVersion: kubevirt.io/v1
kind: VirtualMachine
metadata:
  annotations:
    name.os.template.kubevirt.io/win2k12r2: Microsoft Windows Server 2012 R2
  name: ${name}
  namespace: ${testName}
  labels:
    app: ${name}
    os.template.kubevirt.io/win2k12r2: 'true'
    vm.kubevirt.io/template.namespace: ${COMMON_TEMPLATES_NAMESPACE}
    vm.kubevirt.io/template.revision: '${COMMON_TEMPLATES_REVISION}'
    workload.template.kubevirt.io/server: 'true'
spec:
  running: true
  template:
    metadata:
      creationTimestamp: null
      labels:
        kubevirt.io/domain: ${name}
        kubevirt.io/size: large
        os.template.kubevirt.io/win2k12r2: 'true'
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
            image: 'quay.io/kubevirt/fedora-cloud-container-disk-demo:latest'
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
              - dnf install -y qemu-guest-agent
              - systemctl start qemu-guest-agent
              - ifconfig eth1 ${vmIP} netmask 255.255.255.0 up
          name: cloudinitdisk
status: {}
`;
