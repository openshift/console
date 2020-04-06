const pods = {
  data: [
    {
      metadata: {
        generateName: 'dotnet-6b456f47fb-',
        annotations: {
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.151"\n    ],\n    "dns": {},\n    "default-route": [\n        "10.128.2.1"\n    ]\n}]',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/demo/pods/dotnet-6b456f47fb-8chdt',
        resourceVersion: '32468951',
        name: 'dotnet-6b456f47fb-8chdt',
        uid: 'bb99cc0f-c938-40ae-9598-697262b32c6a',
        creationTimestamp: '2020-04-03T16:33:37Z',
        namespace: 'demo',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'ReplicaSet',
            name: 'dotnet-6b456f47fb',
            uid: 'a549ca01-0141-4104-b1b2-7407e619a246',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'dotnet',
          deploymentconfig: 'dotnet',
          'pod-template-hash': '6b456f47fb',
        },
      },
      spec: {
        restartPolicy: 'Always',
        serviceAccountName: 'default',
        imagePullSecrets: [
          {
            name: 'default-dockercfg-9f9w5',
          },
        ],
        priority: 0,
        schedulerName: 'default-scheduler',
        enableServiceLinks: true,
        terminationGracePeriodSeconds: 30,
        nodeName: 'worker-4',
        securityContext: {
          seLinuxOptions: {
            level: 's0:c27,c19',
          },
          fsGroup: 1000740000,
        },
        containers: [
          {
            resources: {},
            terminationMessagePath: '/dev/termination-log',
            name: 'dotnet',
            securityContext: {
              capabilities: {
                drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'],
              },
              runAsUser: 1000740000,
            },
            ports: [
              {
                containerPort: 8080,
                protocol: 'TCP',
              },
            ],
            imagePullPolicy: 'Always',
            volumeMounts: [
              {
                name: 'default-token-657jj',
                readOnly: true,
                mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
              },
            ],
            terminationMessagePolicy: 'File',
            image: 'dotnet:latest',
          },
        ],
        serviceAccount: 'default',
        volumes: [
          {
            name: 'default-token-657jj',
            secret: {
              secretName: 'default-token-657jj',
              defaultMode: 420,
            },
          },
        ],
        dnsPolicy: 'ClusterFirst',
        tolerations: [
          {
            key: 'node.kubernetes.io/not-ready',
            operator: 'Exists',
            effect: 'NoExecute',
            tolerationSeconds: 300,
          },
          {
            key: 'node.kubernetes.io/unreachable',
            operator: 'Exists',
            effect: 'NoExecute',
            tolerationSeconds: 300,
          },
        ],
      },
      status: {
        phase: 'Pending',
        conditions: [
          {
            type: 'Initialized',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-03T16:33:37Z',
          },
          {
            type: 'Ready',
            status: 'False',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-03T16:33:37Z',
            reason: 'ContainersNotReady',
            message: 'containers with unready status: [dotnet]',
          },
          {
            type: 'ContainersReady',
            status: 'False',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-03T16:33:37Z',
            reason: 'ContainersNotReady',
            message: 'containers with unready status: [dotnet]',
          },
          {
            type: 'PodScheduled',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-03T16:33:37Z',
          },
        ],
        hostIP: '192.168.111.27',
        podIP: '10.128.2.151',
        podIPs: [
          {
            ip: '10.128.2.151',
          },
        ],
        startTime: '2020-04-03T16:33:37Z',
        containerStatuses: [
          {
            name: 'dotnet',
            state: {
              waiting: {
                reason: 'ImagePullBackOff',
                message: 'Back-off pulling image "dotnet:latest"',
              },
            },
            lastState: {},
            ready: false,
            restartCount: 0,
            image: 'dotnet:latest',
            imageID: '',
            started: false,
          },
        ],
        qosClass: 'BestEffort',
      },
    },
    {
      metadata: {
        annotations: {
          'k8s.v1.cni.cncf.io/networks-status': '',
          'openshift.io/deployment-config.name': 'mysql',
          'openshift.io/deployment.name': 'mysql-1',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/demo/pods/mysql-1-deploy',
        resourceVersion: '19721758',
        name: 'mysql-1-deploy',
        uid: '49e0b045-dbf3-4e39-844c-671efb7ef117',
        creationTimestamp: '2020-04-06T19:03:55Z',
        namespace: 'demo',
        ownerReferences: [
          {
            apiVersion: 'v1',
            kind: 'ReplicationController',
            name: 'mysql-1',
            uid: 'f118e585-9bdc-4608-8ac3-e5baf646508e',
          },
        ],
        labels: {
          'openshift.io/deployer-pod-for.name': 'mysql-1',
        },
      },
      spec: {
        restartPolicy: 'Never',
        activeDeadlineSeconds: 21600,
        serviceAccountName: 'deployer',
        imagePullSecrets: [
          {
            name: 'deployer-dockercfg-kbqb9',
          },
        ],
        priority: 0,
        schedulerName: 'default-scheduler',
        enableServiceLinks: true,
        terminationGracePeriodSeconds: 10,
        shareProcessNamespace: false,
        nodeName: 'master-2',
        securityContext: {
          seLinuxOptions: {
            level: 's0:c27,c19',
          },
          fsGroup: 1000740000,
        },
        containers: [
          {
            resources: {},
            terminationMessagePath: '/dev/termination-log',
            name: 'deployment',
            env: [
              {
                name: 'OPENSHIFT_DEPLOYMENT_NAME',
                value: 'mysql-1',
              },
              {
                name: 'OPENSHIFT_DEPLOYMENT_NAMESPACE',
                value: 'demo',
              },
            ],
            securityContext: {
              capabilities: {
                drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'],
              },
              runAsUser: 1000740000,
            },
            imagePullPolicy: 'IfNotPresent',
            volumeMounts: [
              {
                name: 'deployer-token-7r8n8',
                readOnly: true,
                mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
              },
            ],
            terminationMessagePolicy: 'File',
            image:
              'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ca13d6fd248a804272e7c61461c03ce41ba523f1e15a64e4237434841e920af2',
          },
        ],
        serviceAccount: 'deployer',
        volumes: [
          {
            name: 'deployer-token-7r8n8',
            secret: {
              secretName: 'deployer-token-7r8n8',
              defaultMode: 420,
            },
          },
        ],
        dnsPolicy: 'ClusterFirst',
        tolerations: [
          {
            key: 'node.kubernetes.io/not-ready',
            operator: 'Exists',
            effect: 'NoExecute',
            tolerationSeconds: 300,
          },
          {
            key: 'node.kubernetes.io/unreachable',
            operator: 'Exists',
            effect: 'NoExecute',
            tolerationSeconds: 300,
          },
        ],
      },
      status: {
        phase: 'Succeeded',
        conditions: [
          {
            type: 'Initialized',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-06T19:03:55Z',
            reason: 'PodCompleted',
          },
          {
            type: 'Ready',
            status: 'False',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-06T19:05:56Z',
            reason: 'PodCompleted',
          },
          {
            type: 'ContainersReady',
            status: 'False',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-06T19:05:56Z',
            reason: 'PodCompleted',
          },
          {
            type: 'PodScheduled',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-06T19:03:55Z',
          },
        ],
        hostIP: '192.168.111.22',
        podIP: '10.130.0.180',
        podIPs: [
          {
            ip: '10.130.0.180',
          },
        ],
        startTime: '2020-04-06T19:03:55Z',
        containerStatuses: [
          {
            restartCount: 0,
            started: false,
            ready: false,
            name: 'deployment',
            state: {
              terminated: {
                exitCode: 0,
                reason: 'Completed',
                startedAt: '2020-04-06T19:03:58Z',
                finishedAt: '2020-04-06T19:05:56Z',
                containerID:
                  'cri-o://c8b69c5f053f4c98cad180beaf5713776d7af68de244e674396a677076972bd5',
              },
            },
            imageID:
              'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ca13d6fd248a804272e7c61461c03ce41ba523f1e15a64e4237434841e920af2',
            image:
              'quay.io/openshift-release-dev/ocp-v4.0-art-dev@sha256:ca13d6fd248a804272e7c61461c03ce41ba523f1e15a64e4237434841e920af2',
            lastState: {},
            containerID: 'cri-o://c8b69c5f053f4c98cad180beaf5713776d7af68de244e674396a677076972bd5',
          },
        ],
        qosClass: 'BestEffort',
      },
    },
    {
      metadata: {
        generateName: 'mysql-1-',
        annotations: {
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.129.2.157"\n    ],\n    "dns": {},\n    "default-route": [\n        "10.129.2.1"\n    ]\n}]',
          'openshift.io/deployment-config.latest-version': '1',
          'openshift.io/deployment-config.name': 'mysql',
          'openshift.io/deployment.name': 'mysql-1',
          'openshift.io/scc': 'restricted',
        },
        selfLink: '/api/v1/namespaces/demo/pods/mysql-1-lf6c5',
        resourceVersion: '19721730',
        name: 'mysql-1-lf6c5',
        uid: 'dee5c49f-3a45-41ca-91cd-11f8963fedac',
        creationTimestamp: '2020-04-06T19:03:59Z',
        namespace: 'demo',
        ownerReferences: [
          {
            apiVersion: 'v1',
            kind: 'ReplicationController',
            name: 'mysql-1',
            uid: 'f118e585-9bdc-4608-8ac3-e5baf646508e',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          deployment: 'mysql-1',
          deploymentconfig: 'mysql',
          name: 'mysql',
        },
      },
      spec: {
        restartPolicy: 'Always',
        serviceAccountName: 'default',
        imagePullSecrets: [
          {
            name: 'default-dockercfg-9f9w5',
          },
        ],
        priority: 0,
        schedulerName: 'default-scheduler',
        enableServiceLinks: true,
        terminationGracePeriodSeconds: 30,
        nodeName: 'worker-2',
        securityContext: {
          seLinuxOptions: {
            level: 's0:c27,c19',
          },
          fsGroup: 1000740000,
        },
        containers: [
          {
            resources: {
              limits: {
                memory: '512Mi',
              },
              requests: {
                memory: '512Mi',
              },
            },
            readinessProbe: {
              exec: {
                command: [
                  '/bin/sh',
                  '-i',
                  '-c',
                  "MYSQL_PWD='v1vvf44UAC0b38Xm' mysql -h 127.0.0.1 -u cakephp -D default -e 'SELECT 1'",
                ],
              },
              initialDelaySeconds: 5,
              timeoutSeconds: 1,
              periodSeconds: 10,
              successThreshold: 1,
              failureThreshold: 3,
            },
            terminationMessagePath: '/dev/termination-log',
            name: 'mysql',
            livenessProbe: {
              tcpSocket: {
                port: 3306,
              },
              initialDelaySeconds: 30,
              timeoutSeconds: 1,
              periodSeconds: 10,
              successThreshold: 1,
              failureThreshold: 3,
            },
            env: [
              {
                name: 'MYSQL_USER',
                valueFrom: {
                  secretKeyRef: {
                    name: 'cakephp-mysql-example',
                    key: 'database-user',
                  },
                },
              },
              {
                name: 'MYSQL_PASSWORD',
                valueFrom: {
                  secretKeyRef: {
                    name: 'cakephp-mysql-example',
                    key: 'database-password',
                  },
                },
              },
              {
                name: 'MYSQL_DATABASE',
                value: 'default',
              },
            ],
            securityContext: {
              capabilities: {
                drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'],
              },
              runAsUser: 1000740000,
            },
            ports: [
              {
                containerPort: 3306,
                protocol: 'TCP',
              },
            ],
            imagePullPolicy: 'IfNotPresent',
            volumeMounts: [
              {
                name: 'data',
                mountPath: '/var/lib/mysql/data',
              },
              {
                name: 'default-token-657jj',
                readOnly: true,
                mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
              },
            ],
            terminationMessagePolicy: 'File',
            image:
              'registry.redhat.io/rhscl/mysql-57-rhel7@sha256:9a781abe7581cc141e14a7e404ec34125b3e89c008b14f4e7b41e094fd3049fe',
          },
        ],
        serviceAccount: 'default',
        volumes: [
          {
            name: 'data',
            emptyDir: {},
          },
          {
            name: 'default-token-657jj',
            secret: {
              secretName: 'default-token-657jj',
              defaultMode: 420,
            },
          },
        ],
        dnsPolicy: 'ClusterFirst',
        tolerations: [
          {
            key: 'node.kubernetes.io/not-ready',
            operator: 'Exists',
            effect: 'NoExecute',
            tolerationSeconds: 300,
          },
          {
            key: 'node.kubernetes.io/unreachable',
            operator: 'Exists',
            effect: 'NoExecute',
            tolerationSeconds: 300,
          },
          {
            key: 'node.kubernetes.io/memory-pressure',
            operator: 'Exists',
            effect: 'NoSchedule',
          },
        ],
      },
      status: {
        phase: 'Running',
        conditions: [
          {
            type: 'Initialized',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-06T19:03:59Z',
          },
          {
            type: 'Ready',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-06T19:05:56Z',
          },
          {
            type: 'ContainersReady',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-06T19:05:56Z',
          },
          {
            type: 'PodScheduled',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-04-06T19:03:59Z',
          },
        ],
        hostIP: '192.168.111.25',
        podIP: '10.129.2.157',
        podIPs: [
          {
            ip: '10.129.2.157',
          },
        ],
        startTime: '2020-04-06T19:03:59Z',
        containerStatuses: [
          {
            restartCount: 0,
            started: true,
            ready: true,
            name: 'mysql',
            state: {
              running: {
                startedAt: '2020-04-06T19:05:42Z',
              },
            },
            imageID:
              'registry.redhat.io/rhscl/mysql-57-rhel7@sha256:9a781abe7581cc141e14a7e404ec34125b3e89c008b14f4e7b41e094fd3049fe',
            image:
              'registry.redhat.io/rhscl/mysql-57-rhel7@sha256:9a781abe7581cc141e14a7e404ec34125b3e89c008b14f4e7b41e094fd3049fe',
            lastState: {},
            containerID: 'cri-o://20b853e56cf61d8db74765f504e0a26c28ac3d83c5351f9ad4918b771c36968d',
          },
        ],
        qosClass: 'Burstable',
      },
    },
    {
      metadata: {
        generateName: 'virt-launcher-rhel-8-vm-',
        annotations: {
          description: 'VM example',
          'k8s.v1.cni.cncf.io/networks-status':
            '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.130.1.245"\n    ],\n    "dns": {},\n    "default-route": [\n        "10.130.0.1"\n    ]\n}]',
          'kubevirt.io/domain': 'rhel-8-vm',
          'openshift.io/scc': 'kubevirt-controller',
          'traffic.sidecar.istio.io/kubevirtInterfaces': 'k6t-eth0',
        },
        selfLink: '/api/v1/namespaces/demo/pods/virt-launcher-rhel-8-vm-7zb7k',
        resourceVersion: '13068424',
        name: 'virt-launcher-rhel-8-vm-7zb7k',
        uid: 'ce1713e4-473b-4b63-aabf-3006321c6797',
        creationTimestamp: '2020-03-31T14:39:32Z',
        namespace: 'demo',
        ownerReferences: [
          {
            apiVersion: 'kubevirt.io/v1alpha3',
            kind: 'VirtualMachineInstance',
            name: 'rhel-8-vm',
            uid: 'e2ec8a25-ef0c-47a0-8afe-5b58570f97b0',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          'flavor.template.kubevirt.io/tiny': 'true',
          'kubevirt.io': 'virt-launcher',
          'kubevirt.io/created-by': 'e2ec8a25-ef0c-47a0-8afe-5b58570f97b0',
          'kubevirt.io/domain': 'example-04',
          'kubevirt.io/size': 'tiny',
          'os.template.kubevirt.io/fedora31': 'true',
          'vm.kubevirt.io/name': 'rhel-8-vm',
          'workload.template.kubevirt.io/server': 'true',
        },
      },
      spec: {
        nodeSelector: {
          'kubevirt.io/schedulable': 'true',
        },
        restartPolicy: 'Never',
        serviceAccountName: 'default',
        imagePullSecrets: [
          {
            name: 'default-dockercfg-9f9w5',
          },
        ],
        priority: 0,
        schedulerName: 'default-scheduler',
        enableServiceLinks: true,
        terminationGracePeriodSeconds: 30,
        nodeName: 'master-2',
        securityContext: {
          seLinuxOptions: {
            type: 'virt_launcher.process',
          },
          runAsUser: 0,
          fsGroup: 107,
        },
        containers: [
          {
            resources: {
              limits: {
                'devices.kubevirt.io/kvm': '1',
                'devices.kubevirt.io/tun': '1',
                'devices.kubevirt.io/vhost-net': '1',
              },
              requests: {
                cpu: '100m',
                'devices.kubevirt.io/kvm': '1',
                'devices.kubevirt.io/tun': '1',
                'devices.kubevirt.io/vhost-net': '1',
                memory: '1208392Ki',
              },
            },
            readinessProbe: {
              exec: {
                command: ['cat', '/var/run/kubevirt-infra/healthy'],
              },
              initialDelaySeconds: 4,
              timeoutSeconds: 5,
              periodSeconds: 1,
              successThreshold: 1,
              failureThreshold: 5,
            },
            terminationMessagePath: '/dev/termination-log',
            name: 'compute',
            command: [
              '/usr/bin/virt-launcher',
              '--qemu-timeout',
              '5m',
              '--name',
              'rhel-8-vm',
              '--uid',
              'e2ec8a25-ef0c-47a0-8afe-5b58570f97b0',
              '--namespace',
              'demo',
              '--kubevirt-share-dir',
              '/var/run/kubevirt',
              '--ephemeral-disk-dir',
              '/var/run/kubevirt-ephemeral-disks',
              '--container-disk-dir',
              '/var/run/kubevirt/container-disks',
              '--readiness-file',
              '/var/run/kubevirt-infra/healthy',
              '--grace-period-seconds',
              '15',
              '--hook-sidecars',
              '0',
              '--less-pvc-space-toleration',
              '10',
            ],
            securityContext: {
              capabilities: {
                add: ['NET_ADMIN', 'SYS_NICE'],
              },
              privileged: false,
              runAsUser: 0,
            },
            imagePullPolicy: 'IfNotPresent',
            volumeMounts: [
              {
                name: 'ephemeral-disks',
                mountPath: '/var/run/kubevirt-ephemeral-disks',
              },
              {
                name: 'container-disks',
                mountPath: '/var/run/kubevirt/container-disks',
                mountPropagation: 'HostToContainer',
              },
              {
                name: 'virt-share-dir',
                mountPath: '/var/run/kubevirt',
              },
              {
                name: 'libvirt-runtime',
                mountPath: '/var/run/libvirt',
              },
              {
                name: 'infra-ready-mount',
                mountPath: '/var/run/kubevirt-infra',
              },
            ],
            terminationMessagePolicy: 'File',
            image:
              'index.docker.io/kubevirt/virt-launcher@sha256:e900d77e06c20d295a9dbfa356f340778ebc5a9924835b6dc2e83832b8feea64',
          },
          {
            resources: {
              limits: {
                cpu: '100m',
                memory: '40M',
              },
              requests: {
                cpu: '10m',
                memory: '1M',
              },
            },
            readinessProbe: {
              exec: {
                command: ['/usr/bin/container-disk', '--health-check'],
              },
              initialDelaySeconds: 1,
              timeoutSeconds: 1,
              periodSeconds: 1,
              successThreshold: 1,
              failureThreshold: 5,
            },
            terminationMessagePath: '/dev/termination-log',
            name: 'volumecontainerdisk',
            command: ['/usr/bin/container-disk'],
            imagePullPolicy: 'Always',
            volumeMounts: [
              {
                name: 'container-disks',
                mountPath:
                  '/var/run/kubevirt-ephemeral-disks/container-disk-data/e2ec8a25-ef0c-47a0-8afe-5b58570f97b0',
              },
              {
                name: 'virt-bin-share-dir',
                mountPath: '/usr/bin',
              },
            ],
            terminationMessagePolicy: 'File',
            image: 'kubevirt/fedora-cloud-container-disk-demo:latest',
            args: [
              '--copy-path',
              '/var/run/kubevirt-ephemeral-disks/container-disk-data/e2ec8a25-ef0c-47a0-8afe-5b58570f97b0/disk_0',
            ],
          },
        ],
        hostname: 'example-04',
        automountServiceAccountToken: false,
        serviceAccount: 'default',
        volumes: [
          {
            name: 'infra-ready-mount',
            emptyDir: {},
          },
          {
            name: 'virt-share-dir',
            hostPath: {
              path: '/var/run/kubevirt',
              type: '',
            },
          },
          {
            name: 'virt-bin-share-dir',
            hostPath: {
              path: '/var/lib/kubevirt/init/usr/bin',
              type: '',
            },
          },
          {
            name: 'libvirt-runtime',
            emptyDir: {},
          },
          {
            name: 'ephemeral-disks',
            emptyDir: {},
          },
          {
            name: 'container-disks',
            hostPath: {
              path: '/var/run/kubevirt/container-disks/e2ec8a25-ef0c-47a0-8afe-5b58570f97b0',
              type: '',
            },
          },
        ],
        dnsPolicy: 'ClusterFirst',
        tolerations: [
          {
            key: 'node.kubernetes.io/not-ready',
            operator: 'Exists',
            effect: 'NoExecute',
            tolerationSeconds: 300,
          },
          {
            key: 'node.kubernetes.io/unreachable',
            operator: 'Exists',
            effect: 'NoExecute',
            tolerationSeconds: 300,
          },
          {
            key: 'node.kubernetes.io/memory-pressure',
            operator: 'Exists',
            effect: 'NoSchedule',
          },
        ],
      },
      status: {
        phase: 'Running',
        conditions: [
          {
            type: 'Initialized',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-03-31T14:39:32Z',
          },
          {
            type: 'Ready',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-03-31T14:39:40Z',
          },
          {
            type: 'ContainersReady',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-03-31T14:39:40Z',
          },
          {
            type: 'PodScheduled',
            status: 'True',
            lastProbeTime: null,
            lastTransitionTime: '2020-03-31T14:39:32Z',
          },
        ],
        hostIP: '192.168.111.22',
        podIP: '10.130.1.245',
        podIPs: [
          {
            ip: '10.130.1.245',
          },
        ],
        startTime: '2020-03-31T14:39:32Z',
        containerStatuses: [
          {
            restartCount: 0,
            started: true,
            ready: true,
            name: 'compute',
            state: {
              running: {
                startedAt: '2020-03-31T14:39:36Z',
              },
            },
            imageID:
              'docker.io/kubevirt/virt-launcher@sha256:e900d77e06c20d295a9dbfa356f340778ebc5a9924835b6dc2e83832b8feea64',
            image:
              'docker.io/kubevirt/virt-launcher@sha256:e900d77e06c20d295a9dbfa356f340778ebc5a9924835b6dc2e83832b8feea64',
            lastState: {},
            containerID: 'cri-o://0720ed2d49c3a8c273387de6b7527eaabe9e2edb597582ec161d95c285b2e504',
          },
          {
            restartCount: 0,
            started: true,
            ready: true,
            name: 'volumecontainerdisk',
            state: {
              running: {
                startedAt: '2020-03-31T14:39:38Z',
              },
            },
            imageID:
              'docker.io/kubevirt/fedora-cloud-container-disk-demo@sha256:1d4f6f6d52974db84d2e1a031b6f634254fd97823c05d13d98d124846b001d0a',
            image: 'docker.io/kubevirt/fedora-cloud-container-disk-demo:latest',
            lastState: {},
            containerID: 'cri-o://97cb96639e3443146cae4da230c8f044a97221b38017824e2aaed79348b624a2',
          },
        ],
        qosClass: 'Burstable',
      },
    },
  ],
  filters: {},
  kind: 'Pod',
  loadError: '',
  loaded: true,
  selected: null,
};
const replicationControllers = {
  data: [
    {
      metadata: {
        annotations: {
          'openshift.io/deployment-config.name': 'mysql',
          'openshift.io/deployer-pod.completed-at': '2020-04-06 19:05:56 +0000 UTC',
          'openshift.io/deployment.phase': 'Complete',
          'openshift.io/deployer-pod.created-at': '2020-04-06 19:03:55 +0000 UTC',
          'openshift.io/deployment-config.latest-version': '1',
          'openshift.io/deployment.status-reason': 'config change',
          'openshift.io/deployment.replicas': '1',
          'openshift.io/deployer-pod.name': 'mysql-1-deploy',
        },
        selfLink: '/api/v1/namespaces/demo/replicationcontrollers/mysql-1',
        resourceVersion: '19721744',
        name: 'mysql-1',
        uid: 'f118e585-9bdc-4608-8ac3-e5baf646508e',
        creationTimestamp: '2020-04-06T19:03:55Z',
        generation: 2,
        namespace: 'demo',
        ownerReferences: [
          {
            apiVersion: 'apps.openshift.io/v1',
            kind: 'DeploymentConfig',
            name: 'mysql',
            uid: '9f4dc0f6-4eb0-4558-a33a-8b37bd18fab1',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'cakephp-mysql-example',
          'openshift.io/deployment-config.name': 'mysql',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
      },
      spec: {
        replicas: 1,
        selector: {
          deployment: 'mysql-1',
          deploymentconfig: 'mysql',
          name: 'mysql',
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              deployment: 'mysql-1',
              deploymentconfig: 'mysql',
              name: 'mysql',
            },
            annotations: {
              'openshift.io/deployment-config.latest-version': '1',
              'openshift.io/deployment-config.name': 'mysql',
              'openshift.io/deployment.name': 'mysql-1',
            },
          },
          spec: {
            volumes: [
              {
                name: 'data',
                emptyDir: {},
              },
            ],
            containers: [
              {
                resources: {
                  limits: {
                    memory: '512Mi',
                  },
                },
                readinessProbe: {
                  exec: {
                    command: [
                      '/bin/sh',
                      '-i',
                      '-c',
                      "MYSQL_PWD='v1vvf44UAC0b38Xm' mysql -h 127.0.0.1 -u cakephp -D default -e 'SELECT 1'",
                    ],
                  },
                  initialDelaySeconds: 5,
                  timeoutSeconds: 1,
                  periodSeconds: 10,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                terminationMessagePath: '/dev/termination-log',
                name: 'mysql',
                livenessProbe: {
                  tcpSocket: {
                    port: 3306,
                  },
                  initialDelaySeconds: 30,
                  timeoutSeconds: 1,
                  periodSeconds: 10,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                env: [
                  {
                    name: 'MYSQL_USER',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'database-user',
                      },
                    },
                  },
                  {
                    name: 'MYSQL_PASSWORD',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'database-password',
                      },
                    },
                  },
                  {
                    name: 'MYSQL_DATABASE',
                    value: 'default',
                  },
                ],
                ports: [
                  {
                    containerPort: 3306,
                    protocol: 'TCP',
                  },
                ],
                imagePullPolicy: 'IfNotPresent',
                volumeMounts: [
                  {
                    name: 'data',
                    mountPath: '/var/lib/mysql/data',
                  },
                ],
                terminationMessagePolicy: 'File',
                image:
                  'registry.redhat.io/rhscl/mysql-57-rhel7@sha256:9a781abe7581cc141e14a7e404ec34125b3e89c008b14f4e7b41e094fd3049fe',
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
      },
      status: {
        replicas: 1,
        fullyLabeledReplicas: 1,
        readyReplicas: 1,
        availableReplicas: 1,
        observedGeneration: 2,
      },
    },
  ],
  filters: {},
  kind: 'ReplicationController',
  loadError: '',
  loaded: true,
  selected: null,
};
const routes = {
  data: [
    {
      metadata: {
        name: 'cakephp-mysql-example',
        namespace: 'demo',
        selfLink: '/apis/route.openshift.io/v1/namespaces/demo/routes/cakephp-mysql-example',
        uid: '7f807304-719a-4eb7-81d0-e3cbc6ef97bc',
        resourceVersion: '19719013',
        creationTimestamp: '2020-04-06T19:03:53Z',
        labels: {
          app: 'cakephp-mysql-example',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
        annotations: {
          'openshift.io/host.generated': 'true',
        },
      },
      spec: {
        host: 'cakephp-mysql-example-demo.apps.ostest.test.metalkube.org',
        to: {
          kind: 'Service',
          name: 'cakephp-mysql-example',
          weight: 100,
        },
        wildcardPolicy: 'None',
      },
      status: {
        ingress: [
          {
            host: 'cakephp-mysql-example-demo.apps.ostest.test.metalkube.org',
            routerName: 'default',
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2020-04-06T19:03:53Z',
              },
            ],
            wildcardPolicy: 'None',
            routerCanonicalHostname: 'apps.ostest.test.metalkube.org',
          },
        ],
      },
    },
    {
      metadata: {
        name: 'dotnet',
        namespace: 'demo',
        selfLink: '/apis/route.openshift.io/v1/namespaces/demo/routes/dotnet',
        uid: '00381f03-ceae-41ca-8f39-94c66e47bc70',
        resourceVersion: '19625859',
        creationTimestamp: '2020-04-03T16:33:36Z',
        labels: {
          app: 'dotnet',
          'app.kubernetes.io/component': 'dotnet',
          'app.kubernetes.io/instance': 'dotnet',
          'app.kubernetes.io/name': 'dotnet',
          'app.kubernetes.io/part-of': 'application-1',
          'app.openshift.io/runtime': 'dotnet',
          'app.openshift.io/runtime-version': '3.1',
        },
        annotations: {
          'openshift.io/host.generated': 'true',
        },
      },
      spec: {
        host: 'dotnet-demo.apps.ostest.test.metalkube.org',
        to: {
          kind: 'Service',
          name: 'dotnet',
          weight: 100,
        },
        port: {
          targetPort: '8080-tcp',
        },
        wildcardPolicy: 'None',
      },
      status: {
        ingress: [
          {
            host: 'dotnet-demo.apps.ostest.test.metalkube.org',
            routerName: 'default',
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2020-04-03T16:33:37Z',
              },
            ],
            wildcardPolicy: 'None',
            routerCanonicalHostname: 'apps.ostest.test.metalkube.org',
          },
        ],
      },
    },
  ],
  filters: {},
  kind: 'Route',
  loadError: '',
  loaded: true,
  selected: null,
};
const services = {
  data: [
    {
      metadata: {
        name: 'cakephp-mysql-example',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/services/cakephp-mysql-example',
        uid: '87c2e127-f2f4-49c1-89f8-73eb59a0bf54',
        resourceVersion: '19718997',
        creationTimestamp: '2020-04-06T19:03:53Z',
        labels: {
          app: 'cakephp-mysql-example',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
        annotations: {
          description: 'Exposes and load balances the application pods',
          'service.alpha.openshift.io/dependencies': '[{"name": "mysql", "kind": "Service"}]',
        },
      },
      spec: {
        ports: [
          {
            name: 'web',
            protocol: 'TCP',
            port: 8080,
            targetPort: 8080,
          },
        ],
        selector: {
          name: 'cakephp-mysql-example',
        },
        clusterIP: '172.30.10.147',
        type: 'ClusterIP',
        sessionAffinity: 'None',
      },
      status: {
        loadBalancer: {},
      },
    },
    {
      metadata: {
        name: 'dotnet',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/services/dotnet',
        uid: '1aae0d14-b36b-445c-ba3d-afc8b14a18f6',
        resourceVersion: '19625858',
        creationTimestamp: '2020-04-03T16:33:36Z',
        labels: {
          app: 'dotnet',
          'app.kubernetes.io/component': 'dotnet',
          'app.kubernetes.io/instance': 'dotnet',
          'app.kubernetes.io/name': 'dotnet',
          'app.kubernetes.io/part-of': 'application-1',
          'app.openshift.io/runtime': 'dotnet',
          'app.openshift.io/runtime-version': '3.1',
        },
        annotations: {
          'app.openshift.io/vcs-ref': 'dotnetcore-3.1',
          'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/s2i-dotnetcore-ex.git',
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
      spec: {
        ports: [
          {
            name: '8080-tcp',
            protocol: 'TCP',
            port: 8080,
            targetPort: 8080,
          },
        ],
        selector: {
          app: 'dotnet',
          deploymentconfig: 'dotnet',
        },
        clusterIP: '172.30.233.171',
        type: 'ClusterIP',
        sessionAffinity: 'None',
      },
      status: {
        loadBalancer: {},
      },
    },
    {
      metadata: {
        name: 'example',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/services/example',
        uid: '2b8b7070-36af-4d95-9b5f-aaa5223eabe3',
        resourceVersion: '12936764',
        creationTimestamp: '2020-03-31T11:32:09Z',
      },
      spec: {
        ports: [
          {
            protocol: 'TCP',
            port: 80,
            targetPort: 9376,
          },
        ],
        selector: {
          app: 'vm-myapp',
        },
        clusterIP: '172.30.6.239',
        type: 'ClusterIP',
        sessionAffinity: 'None',
      },
      status: {
        loadBalancer: {},
      },
    },
    {
      metadata: {
        name: 'mysql',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/services/mysql',
        uid: '3be5e519-6e26-480a-a9a0-78178c6f6bfe',
        resourceVersion: '19719009',
        creationTimestamp: '2020-04-06T19:03:53Z',
        labels: {
          app: 'cakephp-mysql-example',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
        annotations: {
          description: 'Exposes the database server',
        },
      },
      spec: {
        ports: [
          {
            name: 'mysql',
            protocol: 'TCP',
            port: 3306,
            targetPort: 3306,
          },
        ],
        selector: {
          name: 'mysql',
        },
        clusterIP: '172.30.200.18',
        type: 'ClusterIP',
        sessionAffinity: 'None',
      },
      status: {
        loadBalancer: {},
      },
    },
  ],
  filters: {},
  kind: 'Service',
  loadError: '',
  loaded: true,
  selected: null,
};
const replicaSets = {
  data: [
    {
      metadata: {
        annotations: {
          'deployment.kubernetes.io/revision': '1',
          'app.openshift.io/vcs-ref': 'dotnetcore-3.1',
          'openshift.io/generated-by': 'OpenShiftWebConsole',
          'alpha.image.policy.openshift.io/resolve-names': '*',
          'deployment.kubernetes.io/max-replicas': '2',
          'deployment.kubernetes.io/desired-replicas': '1',
          'app.openshift.io/connects-to': 'rhel-8-vm',
          'image.openshift.io/triggers':
            '[{"from":{"kind":"ImageStreamTag","name":"dotnet:latest"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"dotnet\\")].image"}]',
          'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/s2i-dotnetcore-ex.git',
        },
        selfLink: '/apis/apps/v1/namespaces/demo/replicasets/dotnet-6b456f47fb',
        resourceVersion: '16374780',
        name: 'dotnet-6b456f47fb',
        uid: 'a549ca01-0141-4104-b1b2-7407e619a246',
        creationTimestamp: '2020-04-03T16:33:36Z',
        generation: 1,
        namespace: 'demo',
        ownerReferences: [
          {
            apiVersion: 'apps/v1',
            kind: 'Deployment',
            name: 'dotnet',
            uid: '1b516e94-2fa2-4446-b84c-ef179a81aae3',
            controller: true,
            blockOwnerDeletion: true,
          },
        ],
        labels: {
          app: 'dotnet',
          deploymentconfig: 'dotnet',
          'pod-template-hash': '6b456f47fb',
        },
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: 'dotnet',
            'pod-template-hash': '6b456f47fb',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'dotnet',
              deploymentconfig: 'dotnet',
              'pod-template-hash': '6b456f47fb',
            },
          },
          spec: {
            containers: [
              {
                name: 'dotnet',
                image: 'dotnet:latest',
                ports: [
                  {
                    containerPort: 8080,
                    protocol: 'TCP',
                  },
                ],
                resources: {},
                terminationMessagePath: '/dev/termination-log',
                terminationMessagePolicy: 'File',
                imagePullPolicy: 'Always',
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
      },
      status: {
        replicas: 1,
        fullyLabeledReplicas: 1,
        observedGeneration: 1,
      },
    },
  ],
  filters: {},
  kind: 'ReplicaSet',
  loadError: '',
  loaded: true,
  selected: null,
};
const buildConfigs = {
  data: [
    {
      metadata: {
        name: 'cakephp-mysql-example',
        namespace: 'demo',
        selfLink: '/apis/build.openshift.io/v1/namespaces/demo/buildconfigs/cakephp-mysql-example',
        uid: '6551125f-b893-4014-a307-8d574f4c6b28',
        resourceVersion: '19719019',
        creationTimestamp: '2020-04-06T19:03:53Z',
        labels: {
          app: 'cakephp-mysql-example',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
        annotations: {
          description: 'Defines how to build the application',
          'template.alpha.openshift.io/wait-for-ready': 'true',
        },
      },
      spec: {
        nodeSelector: null,
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'cakephp-mysql-example:latest',
          },
        },
        resources: {},
        successfulBuildsHistoryLimit: 5,
        failedBuildsHistoryLimit: 5,
        strategy: {
          type: 'Source',
          sourceStrategy: {
            from: {
              kind: 'ImageStreamTag',
              namespace: 'openshift',
              name: 'php:7.3',
            },
            env: [
              {
                name: 'COMPOSER_MIRROR',
              },
            ],
          },
        },
        postCommit: {
          script: './vendor/bin/phpunit',
        },
        source: {
          type: 'Git',
          git: {
            uri: 'https://github.com/sclorg/cakephp-ex.git',
          },
        },
        triggers: [
          {
            type: 'ImageChange',
            imageChange: {
              lastTriggeredImageID:
                'registry.redhat.io/rhscl/php-73-rhel7@sha256:9f4e437729b5cba25ec38054b29059db5ceafed49dc36fd0e354a33c2628fdfe',
            },
          },
          {
            type: 'ConfigChange',
          },
          {
            type: 'GitHub',
            github: {
              secret: 'D4sMlfMCCTNTmVayRBk84tbyorpTXC3soarW8ln0',
            },
          },
        ],
        runPolicy: 'Serial',
      },
      status: {
        lastVersion: 1,
      },
    },
    {
      metadata: {
        name: 'dotnet',
        namespace: 'demo',
        selfLink: '/apis/build.openshift.io/v1/namespaces/demo/buildconfigs/dotnet',
        uid: 'f826be9e-c226-4c2a-a905-cdb2109d2aaf',
        resourceVersion: '19625865',
        creationTimestamp: '2020-04-03T16:33:36Z',
        labels: {
          app: 'dotnet',
          'app.kubernetes.io/component': 'dotnet',
          'app.kubernetes.io/instance': 'dotnet',
          'app.kubernetes.io/name': 'dotnet',
          'app.kubernetes.io/part-of': 'application-1',
          'app.openshift.io/runtime': 'dotnet',
          'app.openshift.io/runtime-version': '3.1',
        },
        annotations: {
          'app.openshift.io/vcs-ref': 'dotnetcore-3.1',
          'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/s2i-dotnetcore-ex.git',
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
      },
      spec: {
        nodeSelector: null,
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'dotnet:latest',
          },
        },
        resources: {},
        successfulBuildsHistoryLimit: 5,
        failedBuildsHistoryLimit: 5,
        strategy: {
          type: 'Source',
          sourceStrategy: {
            from: {
              kind: 'ImageStreamTag',
              namespace: 'openshift',
              name: 'dotnet:3.1',
            },
          },
        },
        postCommit: {},
        source: {
          type: 'Git',
          git: {
            uri: 'https://github.com/redhat-developer/s2i-dotnetcore-ex.git',
            ref: 'dotnetcore-3.1',
          },
          contextDir: 'app',
        },
        triggers: [
          {
            type: 'Generic',
            generic: {
              secretReference: {
                name: 'dotnet-generic-webhook-secret',
              },
            },
          },
          {
            type: 'GitHub',
            github: {
              secretReference: {
                name: 'dotnet-github-webhook-secret',
              },
            },
          },
          {
            type: 'ImageChange',
            imageChange: {
              lastTriggeredImageID:
                'registry.redhat.io/dotnet/dotnet-31-rhel7@sha256:efbab79b55b28ca25f3e62a48648a179218a403bb539aa3440edffada5cc0dc9',
            },
          },
          {
            type: 'ConfigChange',
          },
        ],
        runPolicy: 'Serial',
      },
      status: {
        lastVersion: 1,
      },
    },
  ],
  filters: {},
  kind: 'BuildConfig',
  loadError: '',
  loaded: true,
  selected: null,
};
const builds = {
  data: [
    {
      metadata: {
        annotations: {
          'openshift.io/build-config.name': 'cakephp-mysql-example',
          'openshift.io/build.number': '1',
        },
        selfLink: '/apis/build.openshift.io/v1/namespaces/demo/builds/cakephp-mysql-example-1',
        resourceVersion: '19719027',
        name: 'cakephp-mysql-example-1',
        uid: 'e8054236-c028-4680-a9bc-4e173003bd6c',
        creationTimestamp: '2020-04-06T19:03:53Z',
        namespace: 'demo',
        ownerReferences: [
          {
            apiVersion: 'build.openshift.io/v1',
            kind: 'BuildConfig',
            name: 'cakephp-mysql-example',
            uid: '6551125f-b893-4014-a307-8d574f4c6b28',
            controller: true,
          },
        ],
        labels: {
          app: 'cakephp-mysql-example',
          buildconfig: 'cakephp-mysql-example',
          'openshift.io/build-config.name': 'cakephp-mysql-example',
          'openshift.io/build.start-policy': 'Serial',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
      },
      spec: {
        serviceAccount: 'builder',
        source: {
          type: 'Git',
          git: {
            uri: 'https://github.com/sclorg/cakephp-ex.git',
          },
        },
        strategy: {
          type: 'Source',
          sourceStrategy: {
            from: {
              kind: 'DockerImage',
              name:
                'registry.redhat.io/rhscl/php-73-rhel7@sha256:9f4e437729b5cba25ec38054b29059db5ceafed49dc36fd0e354a33c2628fdfe',
            },
            env: [
              {
                name: 'COMPOSER_MIRROR',
              },
            ],
          },
        },
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'cakephp-mysql-example:latest',
          },
        },
        resources: {},
        postCommit: {
          script: './vendor/bin/phpunit',
        },
        nodeSelector: null,
        triggeredBy: [
          {
            message: 'Image change',
            imageChangeBuild: {
              imageID:
                'registry.redhat.io/rhscl/php-73-rhel7@sha256:9f4e437729b5cba25ec38054b29059db5ceafed49dc36fd0e354a33c2628fdfe',
              fromRef: {
                kind: 'ImageStreamTag',
                namespace: 'openshift',
                name: 'php:7.3',
              },
            },
          },
        ],
      },
      status: {
        phase: 'New',
        reason: 'InvalidOutputReference',
        message: 'Output image could not be resolved.',
        config: {
          kind: 'BuildConfig',
          namespace: 'demo',
          name: 'cakephp-mysql-example',
        },
        output: {},
        conditions: [
          {
            type: 'New',
            status: 'True',
            lastUpdateTime: '2020-04-06T19:03:53Z',
            lastTransitionTime: '2020-04-06T19:03:53Z',
            reason: 'InvalidOutputReference',
            message: 'Output image could not be resolved.',
          },
        ],
      },
    },
    {
      metadata: {
        annotations: {
          'openshift.io/build-config.name': 'dotnet',
          'openshift.io/build.number': '1',
        },
        selfLink: '/apis/build.openshift.io/v1/namespaces/demo/builds/dotnet-1',
        resourceVersion: '19625864',
        name: 'dotnet-1',
        uid: 'fe8d5ff2-6c6d-475c-ab9a-b60a688095f7',
        creationTimestamp: '2020-04-03T16:33:37Z',
        namespace: 'demo',
        ownerReferences: [
          {
            apiVersion: 'build.openshift.io/v1',
            kind: 'BuildConfig',
            name: 'dotnet',
            uid: 'f826be9e-c226-4c2a-a905-cdb2109d2aaf',
            controller: true,
          },
        ],
        labels: {
          app: 'dotnet',
          'app.kubernetes.io/part-of': 'application-1',
          'app.kubernetes.io/instance': 'dotnet',
          'openshift.io/build-config.name': 'dotnet',
          'app.kubernetes.io/component': 'dotnet',
          'openshift.io/build.start-policy': 'Serial',
          buildconfig: 'dotnet',
          'app.openshift.io/runtime': 'dotnet',
          'app.kubernetes.io/name': 'dotnet',
          'app.openshift.io/runtime-version': '3.1',
        },
      },
      spec: {
        serviceAccount: 'builder',
        source: {
          type: 'Git',
          git: {
            uri: 'https://github.com/redhat-developer/s2i-dotnetcore-ex.git',
            ref: 'dotnetcore-3.1',
          },
          contextDir: 'app',
        },
        strategy: {
          type: 'Source',
          sourceStrategy: {
            from: {
              kind: 'DockerImage',
              name:
                'registry.redhat.io/dotnet/dotnet-31-rhel7@sha256:efbab79b55b28ca25f3e62a48648a179218a403bb539aa3440edffada5cc0dc9',
            },
          },
        },
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'dotnet:latest',
          },
        },
        resources: {},
        postCommit: {},
        nodeSelector: null,
        triggeredBy: [
          {
            message: 'Image change',
            imageChangeBuild: {
              imageID:
                'registry.redhat.io/dotnet/dotnet-31-rhel7@sha256:efbab79b55b28ca25f3e62a48648a179218a403bb539aa3440edffada5cc0dc9',
              fromRef: {
                kind: 'ImageStreamTag',
                namespace: 'openshift',
                name: 'dotnet:3.1',
              },
            },
          },
        ],
      },
      status: {
        phase: 'New',
        reason: 'InvalidOutputReference',
        message: 'Output image could not be resolved.',
        config: {
          kind: 'BuildConfig',
          namespace: 'demo',
          name: 'dotnet',
        },
        output: {},
        conditions: [
          {
            type: 'New',
            status: 'True',
            lastUpdateTime: '2020-04-03T16:33:37Z',
            lastTransitionTime: '2020-04-03T16:33:36Z',
            reason: 'InvalidOutputReference',
            message: 'Output image could not be resolved.',
          },
        ],
      },
    },
  ],
  filters: {},
  kind: 'Build',
  loadError: '',
  loaded: true,
  selected: null,
};
const statefulSets = {
  data: [],
  filters: {},
  kind: 'StatefulSet',
  loadError: '',
  loaded: true,
  selected: null,
};
const secrets = {
  data: [
    {
      metadata: {
        name: 'cakephp-mysql-example-parameters-mqf92',
        generateName: 'cakephp-mysql-example-parameters-',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/cakephp-mysql-example-parameters-mqf92',
        uid: '6dd82b8b-a4ba-4d20-a087-e9fcc042499d',
        resourceVersion: '19718982',
        creationTimestamp: '2020-04-06T19:03:52Z',
      },
      data: {
        MEMORY_MYSQL_LIMIT: 'NTEyTWk=',
        DATABASE_ENGINE: 'bXlzcWw=',
        NAME: 'Y2FrZXBocC1teXNxbC1leGFtcGxl',
        DATABASE_USER: 'Y2FrZXBocA==',
        DATABASE_NAME: 'ZGVmYXVsdA==',
        OPCACHE_REVALIDATE_FREQ: 'Mg==',
        PHP_VERSION: 'Ny4z',
        DATABASE_SERVICE_NAME: 'bXlzcWw=',
        NAMESPACE: 'b3BlbnNoaWZ0',
        MEMORY_LIMIT: 'NTEyTWk=',
        SOURCE_REPOSITORY_URL: 'aHR0cHM6Ly9naXRodWIuY29tL3NjbG9yZy9jYWtlcGhwLWV4LmdpdA==',
      },
      type: 'Opaque',
    },
    {
      metadata: {
        name: 'cakephp-mysql-example',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/cakephp-mysql-example',
        uid: '16d3c142-b3cc-42ae-bc77-b84b1e0937d8',
        resourceVersion: '19718995',
        creationTimestamp: '2020-04-06T19:03:53Z',
        labels: {
          app: 'cakephp-mysql-example',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
      },
      data: {
        'cakephp-secret-token':
          'dEJsbnVBZkxBVDNNek1xZXpIdGNaQWw5eWJ2dVdWSG9QUW85b0Y2Y3JTcjZQbVNMNDc=',
        'cakephp-security-salt': 'VXdqR0RIc2ZwYjFkYXBINE5MSHM2RWRZVk5GcHdkNXVISENQUmNXdA==',
        'database-password': 'djF2dmY0NFVBQzBiMzhYbQ==',
        'database-user': 'Y2FrZXBocA==',
      },
      type: 'Opaque',
    },
    {
      metadata: {
        name: 'dotnet-github-webhook-secret',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/dotnet-github-webhook-secret',
        uid: 'cc033735-f31c-40a2-92ef-a12bd2747855',
        resourceVersion: '16189863',
        creationTimestamp: '2020-04-03T16:33:36Z',
      },
      data: {
        WebHookSecretKey: 'NWI2NzQ4MTg4MDdkMmZiMA==',
      },
      type: 'Opaque',
    },
    {
      metadata: {
        name: 'default-dockercfg-9f9w5',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/default-dockercfg-9f9w5',
        uid: '017b9a3d-47e4-4290-889f-6dacba0cbf04',
        resourceVersion: '12928435',
        creationTimestamp: '2020-03-31T11:20:40Z',
        annotations: {
          'kubernetes.io/service-account.name': 'default',
          'kubernetes.io/service-account.uid': 'bf62381e-8509-4079-bdbf-bf80ecdc514c',
          'openshift.io/token-secret.name': 'default-token-n4cwh',
        },
        ownerReferences: [
          {
            apiVersion: 'v1',
            kind: 'Secret',
            name: 'default-token-n4cwh',
            uid: '7633333d-cbed-4858-96b6-a3c32fe9cec8',
            controller: true,
            blockOwnerDeletion: false,
          },
        ],
      },
      data: {
        '.dockercfg': 'e30=',
      },
      type: 'kubernetes.io/dockercfg',
    },
    {
      metadata: {
        name: 'dotnet-generic-webhook-secret',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/dotnet-generic-webhook-secret',
        uid: 'fda28c00-4a94-454f-910b-83fe25abc965',
        resourceVersion: '16189858',
        creationTimestamp: '2020-04-03T16:33:36Z',
      },
      data: {
        WebHookSecretKey: 'MDc4NjEwNmIzZjc3OTM4Yg==',
      },
      type: 'Opaque',
    },
    {
      metadata: {
        name: 'deployer-token-7r8n8',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/deployer-token-7r8n8',
        uid: '24258215-7646-4fc6-8b24-acc2bc71c7b9',
        resourceVersion: '12928432',
        creationTimestamp: '2020-03-31T11:20:40Z',
        annotations: {
          'kubernetes.io/service-account.name': 'deployer',
          'kubernetes.io/service-account.uid': 'df6c69f0-bc0a-4f1b-a1be-60a90847435d',
        },
      },
      type: 'kubernetes.io/service-account-token',
    },
    {
      metadata: {
        name: 'default-token-657jj',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/default-token-657jj',
        uid: 'b9831243-c536-47f4-916f-7122244d5a37',
        resourceVersion: '12928431',
        creationTimestamp: '2020-03-31T11:20:40Z',
        annotations: {
          'kubernetes.io/service-account.name': 'default',
          'kubernetes.io/service-account.uid': 'bf62381e-8509-4079-bdbf-bf80ecdc514c',
        },
      },
      type: 'kubernetes.io/service-account-token',
    },
    {
      metadata: {
        name: 'builder-token-79skx',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/builder-token-79skx',
        uid: 'd6dee81c-004b-4fde-a6b3-1ead50a7f2b8',
        resourceVersion: '12928438',
        creationTimestamp: '2020-03-31T11:20:39Z',
        annotations: {
          'kubernetes.io/created-by': 'openshift.io/create-dockercfg-secrets',
          'kubernetes.io/service-account.name': 'builder',
          'kubernetes.io/service-account.uid': 'e0042c4f-5c6f-4a8e-9d6e-7b79d5bb173e',
        },
      },
      type: 'kubernetes.io/service-account-token',
    },
    {
      metadata: {
        name: 'builder-token-tlrn9',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/builder-token-tlrn9',
        uid: 'ba1fb262-81d0-4748-b704-41bf263a4ac3',
        resourceVersion: '12928434',
        creationTimestamp: '2020-03-31T11:20:40Z',
        annotations: {
          'kubernetes.io/service-account.name': 'builder',
          'kubernetes.io/service-account.uid': 'e0042c4f-5c6f-4a8e-9d6e-7b79d5bb173e',
        },
      },
      type: 'kubernetes.io/service-account-token',
    },
    {
      metadata: {
        name: 'builder-dockercfg-m287b',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/builder-dockercfg-m287b',
        uid: 'dbd41d6d-b8be-4423-a26a-e963a200f733',
        resourceVersion: '12928439',
        creationTimestamp: '2020-03-31T11:20:40Z',
        annotations: {
          'kubernetes.io/service-account.name': 'builder',
          'kubernetes.io/service-account.uid': 'e0042c4f-5c6f-4a8e-9d6e-7b79d5bb173e',
          'openshift.io/token-secret.name': 'builder-token-79skx',
        },
        ownerReferences: [
          {
            apiVersion: 'v1',
            kind: 'Secret',
            name: 'builder-token-79skx',
            uid: 'd6dee81c-004b-4fde-a6b3-1ead50a7f2b8',
            controller: true,
            blockOwnerDeletion: false,
          },
        ],
      },
      data: {
        '.dockercfg': 'e30=',
      },
      type: 'kubernetes.io/dockercfg',
    },
    {
      metadata: {
        name: 'deployer-token-56677',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/deployer-token-56677',
        uid: 'db0a315a-4abd-4a96-ac78-b186b5d00d8a',
        resourceVersion: '12928433',
        creationTimestamp: '2020-03-31T11:20:39Z',
        annotations: {
          'kubernetes.io/created-by': 'openshift.io/create-dockercfg-secrets',
          'kubernetes.io/service-account.name': 'deployer',
          'kubernetes.io/service-account.uid': 'df6c69f0-bc0a-4f1b-a1be-60a90847435d',
        },
      },
      type: 'kubernetes.io/service-account-token',
    },
    {
      metadata: {
        name: 'deployer-dockercfg-kbqb9',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/deployer-dockercfg-kbqb9',
        uid: 'a0b8f20a-9c52-46aa-8abf-9204f149f742',
        resourceVersion: '12928437',
        creationTimestamp: '2020-03-31T11:20:40Z',
        annotations: {
          'kubernetes.io/service-account.name': 'deployer',
          'kubernetes.io/service-account.uid': 'df6c69f0-bc0a-4f1b-a1be-60a90847435d',
          'openshift.io/token-secret.name': 'deployer-token-56677',
        },
        ownerReferences: [
          {
            apiVersion: 'v1',
            kind: 'Secret',
            name: 'deployer-token-56677',
            uid: 'db0a315a-4abd-4a96-ac78-b186b5d00d8a',
            controller: true,
            blockOwnerDeletion: false,
          },
        ],
      },
      data: {
        '.dockercfg': 'e30=',
      },
      type: 'kubernetes.io/dockercfg',
    },
    {
      metadata: {
        name: 'default-token-n4cwh',
        namespace: 'demo',
        selfLink: '/api/v1/namespaces/demo/secrets/default-token-n4cwh',
        uid: '7633333d-cbed-4858-96b6-a3c32fe9cec8',
        resourceVersion: '12928430',
        creationTimestamp: '2020-03-31T11:20:39Z',
        annotations: {
          'kubernetes.io/created-by': 'openshift.io/create-dockercfg-secrets',
          'kubernetes.io/service-account.name': 'default',
          'kubernetes.io/service-account.uid': 'bf62381e-8509-4079-bdbf-bf80ecdc514c',
        },
      },
      type: 'kubernetes.io/service-account-token',
    },
  ],
  filters: {},
  kind: 'Secret',
  loadError: '',
  loaded: true,
  optional: true,
  selected: null,
};
const clusterServiceVersions = {
  data: [],
  filters: {},
  kind: 'operators.coreos.com~v1alpha1~ClusterServiceVersion',
  loadError: '',
  loaded: true,
  optional: true,
  selected: null,
};
const virtualmachines = {
  data: [
    {
      apiVersion: 'kubevirt.io/v1alpha3',
      kind: 'VirtualMachine',
      metadata: {
        annotations: {
          description: 'VM example',
          'kubevirt.io/latest-observed-api-version': 'v1alpha3',
          'kubevirt.io/storage-observed-api-version': 'v1alpha3',
          'name.os.template.kubevirt.io/fedora31': 'Fedora 31',
        },
        selfLink: '/apis/kubevirt.io/v1alpha3/namespaces/demo/virtualmachines/rhel-8-vm',
        resourceVersion: '19721276',
        name: 'rhel-8-vm',
        uid: 'da7ac419-97b1-45dd-9f47-e15f77ddbb11',
        creationTimestamp: '2020-03-31T14:27:27Z',
        generation: 8,
        namespace: 'demo',
        labels: {
          app: 'example-04',
          'flavor.template.kubevirt.io/tiny': 'true',
          'os.template.kubevirt.io/fedora31': 'true',
          'vm.kubevirt.io/template': 'fedora-server-tiny-v0.7.0',
          'vm.kubevirt.io/template.namespace': 'openshift',
          'vm.kubevirt.io/template.revision': '1',
          'vm.kubevirt.io/template.version': 'v0.8.2',
          'workload.template.kubevirt.io/server': 'true',
        },
      },
      spec: {
        running: true,
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              'flavor.template.kubevirt.io/tiny': 'true',
              'kubevirt.io/domain': 'example-04',
              'kubevirt.io/size': 'tiny',
              'os.template.kubevirt.io/fedora31': 'true',
              'vm.kubevirt.io/name': 'rhel-8-vm',
              'workload.template.kubevirt.io/server': 'true',
            },
          },
          spec: {
            domain: {
              cpu: {
                cores: 1,
                sockets: 1,
                threads: 1,
              },
              devices: {
                disks: [
                  {
                    bootOrder: 1,
                    disk: {
                      bus: 'virtio',
                    },
                    name: 'containerdisk',
                  },
                  {
                    disk: {
                      bus: 'virtio',
                    },
                    name: 'cloudinitdisk',
                  },
                ],
                interfaces: [
                  {
                    masquerade: {},
                    name: 'default',
                  },
                ],
                networkInterfaceMultiqueue: true,
                rng: {},
              },
              machine: {
                type: 'q35',
              },
              resources: {
                requests: {
                  memory: '1Gi',
                },
              },
            },
            evictionStrategy: 'LiveMigrate',
            hostname: 'example-04',
            networks: [
              {
                name: 'default',
                pod: {},
              },
            ],
            terminationGracePeriodSeconds: 0,
            volumes: [
              {
                containerDisk: {
                  image: 'kubevirt/fedora-cloud-container-disk-demo:latest',
                },
                name: 'containerdisk',
              },
              {
                cloudInitNoCloud: {
                  userData: '#cloud-config\npassword: fedora\nchpasswd: { expire: False }',
                },
                name: 'cloudinitdisk',
              },
            ],
          },
        },
      },
      status: {
        created: true,
        ready: true,
      },
    },
    {
      apiVersion: 'kubevirt.io/v1alpha3',
      kind: 'VirtualMachine',
      metadata: {
        annotations: {
          'app.openshift.io/connects-to': 'cakephp-mysql-example',
          description: 'VM example',
          'kubevirt.io/latest-observed-api-version': 'v1alpha3',
          'kubevirt.io/storage-observed-api-version': 'v1alpha3',
          'name.os.template.kubevirt.io/fedora31': 'Fedora 31',
        },
        selfLink: '/apis/kubevirt.io/v1alpha3/namespaces/demo/virtualmachines/rhel-8-vm',
        resourceVersion: '32488379',
        name: 'rhel-8-vm-grouped',
        uid: 'da7ac419-97b1-45dd-9f47-e15f77ddbb11-2',
        creationTimestamp: '2020-03-31T14:27:27Z',
        generation: 8,
        namespace: 'demo',
        labels: {
          'flavor.template.kubevirt.io/tiny': 'true',
          app: 'example-04',
          'app.kubernetes.io/part-of': 'application-1',
          'vm.kubevirt.io/template': 'fedora-server-tiny-v0.7.0',
          'vm.kubevirt.io/template.version': 'v0.8.2',
          'vm.kubevirt.io/template.namespace': 'openshift',
          'vm.kubevirt.io/template.revision': '1',
          'workload.template.kubevirt.io/server': 'true',
          'os.template.kubevirt.io/fedora31': 'true',
        },
      },
      spec: {
        running: true,
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              'flavor.template.kubevirt.io/tiny': 'true',
              'kubevirt.io/domain': 'example-04',
              'kubevirt.io/size': 'tiny',
              'os.template.kubevirt.io/fedora31': 'true',
              'vm.kubevirt.io/name': 'rhel-8-vm',
              'workload.template.kubevirt.io/server': 'true',
            },
          },
          spec: {
            domain: {
              cpu: {
                cores: 1,
                sockets: 1,
                threads: 1,
              },
              devices: {
                disks: [
                  {
                    bootOrder: 1,
                    disk: {
                      bus: 'virtio',
                    },
                    name: 'containerdisk',
                  },
                  {
                    disk: {
                      bus: 'virtio',
                    },
                    name: 'cloudinitdisk',
                  },
                ],
                interfaces: [
                  {
                    masquerade: {},
                    name: 'default',
                  },
                ],
                networkInterfaceMultiqueue: true,
                rng: {},
              },
              machine: {
                type: 'q35',
              },
              resources: {
                requests: {
                  memory: '1Gi',
                },
              },
            },
            evictionStrategy: 'LiveMigrate',
            hostname: 'example-04',
            networks: [
              {
                name: 'default',
                pod: {},
              },
            ],
            terminationGracePeriodSeconds: 0,
            volumes: [
              {
                containerDisk: {
                  image: 'kubevirt/fedora-cloud-container-disk-demo:latest',
                },
                name: 'containerdisk',
              },
              {
                cloudInitNoCloud: {
                  userData: '#cloud-config\npassword: fedora\nchpasswd: { expire: False }',
                },
                name: 'cloudinitdisk',
              },
            ],
          },
        },
      },
      status: {
        created: true,
        ready: true,
      },
    },
  ],
  filters: {},
  kind: 'VirtualMachine',
  loadError: '',
  loaded: true,
  selected: null,
};
const virtualmachineinstances = {
  data: [
    {
      apiVersion: 'kubevirt.io/v1alpha3',
      kind: 'VirtualMachineInstance',
      metadata: {
        generateName: 'rhel-8-vm',
        annotations: {
          description: 'VM example',
          'kubevirt.io/latest-observed-api-version': 'v1alpha3',
          'kubevirt.io/storage-observed-api-version': 'v1alpha3',
        },
        selfLink: '/apis/kubevirt.io/v1alpha3/namespaces/demo/virtualmachineinstances/rhel-8-vm',
        resourceVersion: '13068442',
        name: 'rhel-8-vm',
        uid: 'e2ec8a25-ef0c-47a0-8afe-5b58570f97b0',
        creationTimestamp: '2020-03-31T14:39:32Z',
        generation: 8,
        namespace: 'demo',
        ownerReferences: [
          {
            apiVersion: 'kubevirt.io/v1alpha3',
            blockOwnerDeletion: true,
            controller: true,
            kind: 'VirtualMachine',
            name: 'rhel-8-vm',
            uid: 'da7ac419-97b1-45dd-9f47-e15f77ddbb11',
          },
        ],
        finalizers: ['foregroundDeleteVirtualMachine'],
        labels: {
          'flavor.template.kubevirt.io/tiny': 'true',
          'kubevirt.io/domain': 'example-04',
          'kubevirt.io/nodeName': 'master-2',
          'kubevirt.io/size': 'tiny',
          'os.template.kubevirt.io/fedora31': 'true',
          'vm.kubevirt.io/name': 'rhel-8-vm',
          'workload.template.kubevirt.io/server': 'true',
        },
      },
      spec: {
        domain: {
          cpu: {
            cores: 1,
            sockets: 1,
            threads: 1,
          },
          devices: {
            disks: [
              {
                bootOrder: 1,
                disk: {
                  bus: 'virtio',
                },
                name: 'containerdisk',
              },
              {
                disk: {
                  bus: 'virtio',
                },
                name: 'cloudinitdisk',
              },
            ],
            interfaces: [
              {
                masquerade: {},
                name: 'default',
              },
            ],
            networkInterfaceMultiqueue: true,
            rng: {},
          },
          features: {
            acpi: {
              enabled: true,
            },
          },
          firmware: {
            uuid: '793fac73-58f2-5e8c-826b-a3619645844d',
          },
          machine: {
            type: 'q35',
          },
          resources: {
            requests: {
              cpu: '100m',
              memory: '1Gi',
            },
          },
        },
        evictionStrategy: 'LiveMigrate',
        hostname: 'example-04',
        networks: [
          {
            name: 'default',
            pod: {},
          },
        ],
        terminationGracePeriodSeconds: 0,
        volumes: [
          {
            containerDisk: {
              image: 'kubevirt/fedora-cloud-container-disk-demo:latest',
              imagePullPolicy: 'Always',
            },
            name: 'containerdisk',
          },
          {
            cloudInitNoCloud: {
              userData: '#cloud-config\npassword: fedora\nchpasswd: { expire: False }',
            },
            name: 'cloudinitdisk',
          },
        ],
      },
      status: {
        conditions: [
          {
            lastProbeTime: null,
            lastTransitionTime: null,
            status: 'True',
            type: 'LiveMigratable',
          },
          {
            lastProbeTime: null,
            lastTransitionTime: '2020-03-31T14:39:40Z',
            status: 'True',
            type: 'Ready',
          },
        ],
        guestOSInfo: {},
        interfaces: [
          {
            ipAddress: '10.130.1.245',
            mac: '02:00:00:19:26:ad',
            name: 'default',
          },
        ],
        migrationMethod: 'BlockMigration',
        nodeName: 'master-2',
        phase: 'Running',
        qosClass: 'Burstable',
      },
    },
  ],
  filters: {},
  kind: 'VirtualMachineInstance',
  loadError: '',
  loaded: true,
  selected: null,
};
const migrations = {
  data: [],
  filters: {},
  kind: 'VirtualMachineInstanceMigration',
  loadError: '',
  loaded: true,
  selected: null,
};

const deploymentConfigs = {
  data: [
    {
      metadata: {
        annotations: {
          description: 'Defines how to deploy the application server',
          'template.alpha.openshift.io/wait-for-ready': 'true',
        },
        selfLink:
          '/apis/apps.openshift.io/v1/namespaces/demo/deploymentconfigs/cakephp-mysql-example',
        resourceVersion: '19721350',
        name: 'cakephp-mysql-example',
        uid: '1e7e7767-0da2-4aac-97e9-bcf1ac4bfcac',
        creationTimestamp: '2020-04-06T19:03:53Z',
        generation: 1,
        namespace: 'demo',
        labels: {
          app: 'cakephp-mysql-example',
          'app.kubernetes.io/part-of': 'application-2',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
      },
      spec: {
        strategy: {
          type: 'Recreate',
          recreateParams: {
            timeoutSeconds: 600,
            pre: {
              failurePolicy: 'Retry',
              execNewPod: {
                command: ['./migrate-database.sh'],
                containerName: 'cakephp-mysql-example',
              },
            },
          },
          resources: {},
          activeDeadlineSeconds: 21600,
        },
        triggers: [
          {
            type: 'ImageChange',
            imageChangeParams: {
              automatic: true,
              containerNames: ['cakephp-mysql-example'],
              from: {
                kind: 'ImageStreamTag',
                namespace: 'demo',
                name: 'cakephp-mysql-example:latest',
              },
            },
          },
          {
            type: 'ConfigChange',
          },
        ],
        replicas: 1,
        revisionHistoryLimit: 10,
        test: false,
        selector: {
          name: 'cakephp-mysql-example',
        },
        template: {
          metadata: {
            name: 'cakephp-mysql-example',
            creationTimestamp: null,
            labels: {
              name: 'cakephp-mysql-example',
            },
          },
          spec: {
            containers: [
              {
                resources: {
                  limits: {
                    memory: '512Mi',
                  },
                },
                readinessProbe: {
                  httpGet: {
                    path: '/health.php',
                    port: 8080,
                    scheme: 'HTTP',
                  },
                  initialDelaySeconds: 3,
                  timeoutSeconds: 3,
                  periodSeconds: 60,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                terminationMessagePath: '/dev/termination-log',
                name: 'cakephp-mysql-example',
                livenessProbe: {
                  httpGet: {
                    path: '/health.php',
                    port: 8080,
                    scheme: 'HTTP',
                  },
                  initialDelaySeconds: 30,
                  timeoutSeconds: 3,
                  periodSeconds: 60,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                env: [
                  {
                    name: 'DATABASE_SERVICE_NAME',
                    value: 'mysql',
                  },
                  {
                    name: 'DATABASE_ENGINE',
                    value: 'mysql',
                  },
                  {
                    name: 'DATABASE_NAME',
                    value: 'default',
                  },
                  {
                    name: 'DATABASE_USER',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'database-user',
                      },
                    },
                  },
                  {
                    name: 'DATABASE_PASSWORD',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'database-password',
                      },
                    },
                  },
                  {
                    name: 'CAKEPHP_SECRET_TOKEN',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'cakephp-secret-token',
                      },
                    },
                  },
                  {
                    name: 'CAKEPHP_SECURITY_SALT',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'cakephp-security-salt',
                      },
                    },
                  },
                  {
                    name: 'OPCACHE_REVALIDATE_FREQ',
                    value: '2',
                  },
                ],
                ports: [
                  {
                    containerPort: 8080,
                    protocol: 'TCP',
                  },
                ],
                imagePullPolicy: 'IfNotPresent',
                terminationMessagePolicy: 'File',
                image: ' ',
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
      },
      status: {
        latestVersion: 0,
        observedGeneration: 1,
        replicas: 0,
        updatedReplicas: 0,
        availableReplicas: 0,
        unavailableReplicas: 0,
        conditions: [
          {
            type: 'Available',
            status: 'False',
            lastUpdateTime: '2020-04-06T19:03:53Z',
            lastTransitionTime: '2020-04-06T19:03:53Z',
            message: 'Deployment config does not have minimum availability.',
          },
        ],
      },
    },
    {
      metadata: {
        annotations: {
          description: 'Defines how to deploy the database',
          'template.alpha.openshift.io/wait-for-ready': 'true',
        },
        selfLink: '/apis/apps.openshift.io/v1/namespaces/demo/deploymentconfigs/mysql',
        resourceVersion: '19721745',
        name: 'mysql',
        uid: '9f4dc0f6-4eb0-4558-a33a-8b37bd18fab1',
        creationTimestamp: '2020-04-06T19:03:53Z',
        generation: 2,
        namespace: 'demo',
        labels: {
          app: 'cakephp-mysql-example',
          'app.kubernetes.io/part-of': 'application-2',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
      },
      spec: {
        strategy: {
          type: 'Recreate',
          recreateParams: {
            timeoutSeconds: 600,
          },
          resources: {},
          activeDeadlineSeconds: 21600,
        },
        triggers: [
          {
            type: 'ImageChange',
            imageChangeParams: {
              automatic: true,
              containerNames: ['mysql'],
              from: {
                kind: 'ImageStreamTag',
                namespace: 'openshift',
                name: 'mysql:5.7',
              },
              lastTriggeredImage:
                'registry.redhat.io/rhscl/mysql-57-rhel7@sha256:9a781abe7581cc141e14a7e404ec34125b3e89c008b14f4e7b41e094fd3049fe',
            },
          },
          {
            type: 'ConfigChange',
          },
        ],
        replicas: 1,
        revisionHistoryLimit: 10,
        test: false,
        selector: {
          name: 'mysql',
        },
        template: {
          metadata: {
            name: 'mysql',
            creationTimestamp: null,
            labels: {
              name: 'mysql',
            },
          },
          spec: {
            volumes: [
              {
                name: 'data',
                emptyDir: {},
              },
            ],
            containers: [
              {
                resources: {
                  limits: {
                    memory: '512Mi',
                  },
                },
                readinessProbe: {
                  exec: {
                    command: [
                      '/bin/sh',
                      '-i',
                      '-c',
                      "MYSQL_PWD='v1vvf44UAC0b38Xm' mysql -h 127.0.0.1 -u cakephp -D default -e 'SELECT 1'",
                    ],
                  },
                  initialDelaySeconds: 5,
                  timeoutSeconds: 1,
                  periodSeconds: 10,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                terminationMessagePath: '/dev/termination-log',
                name: 'mysql',
                livenessProbe: {
                  tcpSocket: {
                    port: 3306,
                  },
                  initialDelaySeconds: 30,
                  timeoutSeconds: 1,
                  periodSeconds: 10,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                env: [
                  {
                    name: 'MYSQL_USER',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'database-user',
                      },
                    },
                  },
                  {
                    name: 'MYSQL_PASSWORD',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'database-password',
                      },
                    },
                  },
                  {
                    name: 'MYSQL_DATABASE',
                    value: 'default',
                  },
                ],
                ports: [
                  {
                    containerPort: 3306,
                    protocol: 'TCP',
                  },
                ],
                imagePullPolicy: 'IfNotPresent',
                volumeMounts: [
                  {
                    name: 'data',
                    mountPath: '/var/lib/mysql/data',
                  },
                ],
                terminationMessagePolicy: 'File',
                image:
                  'registry.redhat.io/rhscl/mysql-57-rhel7@sha256:9a781abe7581cc141e14a7e404ec34125b3e89c008b14f4e7b41e094fd3049fe',
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
      },
      status: {
        observedGeneration: 2,
        details: {
          message: 'config change',
          causes: [
            {
              type: 'ConfigChange',
            },
          ],
        },
        availableReplicas: 1,
        unavailableReplicas: 0,
        latestVersion: 1,
        updatedReplicas: 1,
        conditions: [
          {
            type: 'Available',
            status: 'True',
            lastUpdateTime: '2020-04-06T19:05:56Z',
            lastTransitionTime: '2020-04-06T19:05:56Z',
            message: 'Deployment config has minimum availability.',
          },
          {
            type: 'Progressing',
            status: 'True',
            lastUpdateTime: '2020-04-06T19:05:56Z',
            lastTransitionTime: '2020-04-06T19:03:59Z',
            reason: 'NewReplicationControllerAvailable',
            message: 'replication controller "mysql-1" successfully rolled out',
          },
        ],
        replicas: 1,
        readyReplicas: 1,
      },
    },
    {
      kind: 'DeploymentConfig',
      apiVersion: 'apps.openshift.io/v1',
      metadata: {
        annotations: {
          'app.openshift.io/connects-to': 'rhel-8-vm',
          description: 'Defines how to deploy the database',
          'template.alpha.openshift.io/wait-for-ready': 'true',
        },
        selfLink: '/apis/apps.openshift.io/v1/namespaces/demo/deploymentconfigs/mysql',
        resourceVersion: '32488590',
        name: 'mysql-connected',
        uid: '9f4dc0f6-4eb0-4558-a33a-8b37bd18fab1-2',
        creationTimestamp: '2020-04-06T19:03:53Z',
        generation: 2,
        namespace: 'demo',
        labels: {
          app: 'cakephp-mysql-example',
          'app.kubernetes.io/part-of': 'application-2',
          template: 'cakephp-mysql-example',
          'template.openshift.io/template-instance-owner': '14aba4d8-9d3e-425b-a2ec-bfb89aa8851c',
        },
      },
      spec: {
        strategy: {
          type: 'Recreate',
          recreateParams: {
            timeoutSeconds: 600,
          },
          resources: {},
          activeDeadlineSeconds: 21600,
        },
        triggers: [
          {
            type: 'ImageChange',
            imageChangeParams: {
              automatic: true,
              containerNames: ['mysql'],
              from: {
                kind: 'ImageStreamTag',
                namespace: 'openshift',
                name: 'mysql:5.7',
              },
              lastTriggeredImage:
                'registry.redhat.io/rhscl/mysql-57-rhel7@sha256:9a781abe7581cc141e14a7e404ec34125b3e89c008b14f4e7b41e094fd3049fe',
            },
          },
          {
            type: 'ConfigChange',
          },
        ],
        replicas: 1,
        revisionHistoryLimit: 10,
        test: false,
        selector: {
          name: 'mysql',
        },
        template: {
          metadata: {
            name: 'mysql',
            creationTimestamp: null,
            labels: {
              name: 'mysql',
            },
          },
          spec: {
            volumes: [
              {
                name: 'data',
                emptyDir: {},
              },
            ],
            containers: [
              {
                resources: {
                  limits: {
                    memory: '512Mi',
                  },
                },
                readinessProbe: {
                  exec: {
                    command: [
                      '/bin/sh',
                      '-i',
                      '-c',
                      "MYSQL_PWD='v1vvf44UAC0b38Xm' mysql -h 127.0.0.1 -u cakephp -D default -e 'SELECT 1'",
                    ],
                  },
                  initialDelaySeconds: 5,
                  timeoutSeconds: 1,
                  periodSeconds: 10,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                terminationMessagePath: '/dev/termination-log',
                name: 'mysql',
                livenessProbe: {
                  tcpSocket: {
                    port: 3306,
                  },
                  initialDelaySeconds: 30,
                  timeoutSeconds: 1,
                  periodSeconds: 10,
                  successThreshold: 1,
                  failureThreshold: 3,
                },
                env: [
                  {
                    name: 'MYSQL_USER',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'database-user',
                      },
                    },
                  },
                  {
                    name: 'MYSQL_PASSWORD',
                    valueFrom: {
                      secretKeyRef: {
                        name: 'cakephp-mysql-example',
                        key: 'database-password',
                      },
                    },
                  },
                  {
                    name: 'MYSQL_DATABASE',
                    value: 'default',
                  },
                ],
                ports: [
                  {
                    containerPort: 3306,
                    protocol: 'TCP',
                  },
                ],
                imagePullPolicy: 'IfNotPresent',
                volumeMounts: [
                  {
                    name: 'data',
                    mountPath: '/var/lib/mysql/data',
                  },
                ],
                terminationMessagePolicy: 'File',
                image:
                  'registry.redhat.io/rhscl/mysql-57-rhel7@sha256:9a781abe7581cc141e14a7e404ec34125b3e89c008b14f4e7b41e094fd3049fe',
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
      },
      status: {
        observedGeneration: 2,
        details: {
          message: 'config change',
          causes: [
            {
              type: 'ConfigChange',
            },
          ],
        },
        availableReplicas: 1,
        unavailableReplicas: 0,
        latestVersion: 1,
        updatedReplicas: 1,
        conditions: [
          {
            type: 'Available',
            status: 'True',
            lastUpdateTime: '2020-04-06T19:05:56Z',
            lastTransitionTime: '2020-04-06T19:05:56Z',
            message: 'Deployment config has minimum availability.',
          },
          {
            type: 'Progressing',
            status: 'True',
            lastUpdateTime: '2020-04-06T19:05:56Z',
            lastTransitionTime: '2020-04-06T19:03:59Z',
            reason: 'NewReplicationControllerAvailable',
            message: 'replication controller "mysql-1" successfully rolled out',
          },
        ],
        replicas: 1,
        readyReplicas: 1,
      },
    },
  ],
  filters: {},
  kind: 'DeploymentConfig',
  loadError: '',
  loaded: true,
  selected: null,
};

const deployments = {
  data: [
    {
      metadata: {
        annotations: {
          'alpha.image.policy.openshift.io/resolve-names': '*',
          'app.openshift.io/vcs-ref': 'dotnetcore-3.1',
          'app.openshift.io/vcs-uri': 'https://github.com/redhat-developer/s2i-dotnetcore-ex.git',
          'deployment.kubernetes.io/revision': '1',
          'image.openshift.io/triggers':
            '[{"from":{"kind":"ImageStreamTag","name":"dotnet:latest"},"fieldPath":"spec.template.spec.containers[?(@.name==\\"dotnet\\")].image"}]',
          'openshift.io/generated-by': 'OpenShiftWebConsole',
        },
        selfLink: '/apis/apps/v1/namespaces/demo/deployments/dotnet',
        resourceVersion: '19625850',
        name: 'dotnet',
        uid: '1b516e94-2fa2-4446-b84c-ef179a81aae3',
        creationTimestamp: '2020-04-03T16:33:36Z',
        generation: 3,
        namespace: 'demo',
        labels: {
          app: 'dotnet',
          'app.kubernetes.io/component': 'dotnet',
          'app.kubernetes.io/instance': 'dotnet',
          'app.kubernetes.io/name': 'dotnet',
          'app.kubernetes.io/part-of': 'application-1',
          'app.openshift.io/runtime': 'dotnet',
          'app.openshift.io/runtime-version': '3.1',
        },
      },
      spec: {
        replicas: 1,
        selector: {
          matchLabels: {
            app: 'dotnet',
          },
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'dotnet',
              deploymentconfig: 'dotnet',
            },
          },
          spec: {
            containers: [
              {
                name: 'dotnet',
                image: 'dotnet:latest',
                ports: [
                  {
                    containerPort: 8080,
                    protocol: 'TCP',
                  },
                ],
                resources: {},
                terminationMessagePath: '/dev/termination-log',
                terminationMessagePolicy: 'File',
                imagePullPolicy: 'Always',
              },
            ],
            restartPolicy: 'Always',
            terminationGracePeriodSeconds: 30,
            dnsPolicy: 'ClusterFirst',
            securityContext: {},
            schedulerName: 'default-scheduler',
          },
        },
        strategy: {
          type: 'RollingUpdate',
          rollingUpdate: {
            maxUnavailable: '25%',
            maxSurge: '25%',
          },
        },
        revisionHistoryLimit: 10,
        progressDeadlineSeconds: 600,
      },
      status: {
        observedGeneration: 3,
        replicas: 1,
        updatedReplicas: 1,
        unavailableReplicas: 1,
        conditions: [
          {
            type: 'Available',
            status: 'False',
            lastUpdateTime: '2020-04-03T16:33:36Z',
            lastTransitionTime: '2020-04-03T16:33:36Z',
            reason: 'MinimumReplicasUnavailable',
            message: 'Deployment does not have minimum availability.',
          },
          {
            type: 'Progressing',
            status: 'False',
            lastUpdateTime: '2020-04-03T16:43:38Z',
            lastTransitionTime: '2020-04-03T16:43:38Z',
            reason: 'ProgressDeadlineExceeded',
            message: 'ReplicaSet "dotnet-6b456f47fb" has timed out progressing.',
          },
        ],
      },
    },
  ],
  filters: {},
  kind: 'Deployment',
  loadError: '',
  loaded: true,
  selected: null,
};

const daemonSets = {
  data: [],
  filters: {},
  kind: 'DaemonSet',
  loadError: '',
  loaded: true,
  selected: null,
};

const virtualmachinetemplates = {
  data: [
    {
      metadata: {
        annotations: {
          'name.os.template.kubevirt.io/centos8.0': 'CentOS 8.0',
          'template.kubevirt.io/version': 'v1alpha1',
          'openshift.io/display-name': 'CentOS 7.0+ VM',
          'openshift.io/documentation-url': 'https://github.com/kubevirt/common-templates',
          'defaults.template.kubevirt.io/disk': 'rootdisk',
          'template.kubevirt.io/editable':
            '/objects[0].spec.template.spec.domain.cpu.sockets\n/objects[0].spec.template.spec.domain.cpu.cores\n/objects[0].spec.template.spec.domain.cpu.threads\n/objects[0].spec.template.spec.domain.resources.requests.memory\n/objects[0].spec.template.spec.domain.devices.disks\n/objects[0].spec.template.spec.volumes\n/objects[0].spec.template.spec.networks\n',
          'template.openshift.io/bindable': 'false',
          tags: 'kubevirt,virtualmachine,linux,centos',
          validations:
            '[\n  {\n    "name": "minimal-required-memory",\n    "path": "jsonpath::.spec.domain.resources.requests.memory",\n    "rule": "integer",\n    "message": "This VM requires more memory.",\n    "min": 1073741824\n  }\n]\n',
          description:
            'This template can be used to create a VM suitable for CentOS 7 and newer. The template assumes that a PVC is available which is providing the necessary CentOS disk image.',
          'openshift.io/support-url': 'https://github.com/kubevirt/common-templates/issues',
          iconClass: 'icon-centos',
          'openshift.io/provider-display-name': 'KubeVirt',
        },
        selfLink:
          '/apis/template.openshift.io/v1/namespaces/openshift/templates/centos8-server-small-v0.7.0',
        resourceVersion: '31735',
        name: 'centos8-server-small-v0.7.0',
        uid: '04e18320-1942-40d9-a8fe-bb816128030d',
        creationTimestamp: '2020-03-19T06:22:22Z',
        namespace: 'openshift',
        ownerReferences: [
          {
            apiVersion: 'kubevirt.io/v1',
            kind: 'KubevirtCommonTemplatesBundle',
            name: 'common-templates-kubevirt-hyperconverged',
            uid: 'a2e92d8f-b430-48da-8148-681f1659ca6f',
          },
        ],
        labels: {
          'flavor.template.kubevirt.io/small': 'true',
          'os.template.kubevirt.io/centos8.0': 'true',
          'template.kubevirt.io/type': 'base',
          'template.kubevirt.io/version': 'v0.8.2',
          'workload.template.kubevirt.io/server': 'true',
        },
      },
    },
    {
      metadata: {
        annotations: {
          'name.os.template.kubevirt.io/fedora30': 'Fedora 30',
          'name.os.template.kubevirt.io/fedora31': 'Fedora 31',
          'template.kubevirt.io/version': 'v1alpha1',
          'openshift.io/display-name': 'Fedora 23+ VM',
          'openshift.io/documentation-url': 'https://github.com/kubevirt/common-templates',
          'name.os.template.kubevirt.io/fedora29': 'Fedora 29',
          'name.os.template.kubevirt.io/silverblue30': 'Fedora Silverblue 30',
          'name.os.template.kubevirt.io/silverblue31': 'Fedora Silverblue 31',
          'defaults.template.kubevirt.io/disk': 'rootdisk',
          'template.kubevirt.io/editable':
            '/objects[0].spec.template.spec.domain.cpu.sockets\n/objects[0].spec.template.spec.domain.cpu.cores\n/objects[0].spec.template.spec.domain.cpu.threads\n/objects[0].spec.template.spec.domain.resources.requests.memory\n/objects[0].spec.template.spec.domain.devices.disks\n/objects[0].spec.template.spec.volumes\n/objects[0].spec.template.spec.networks\n',
          'template.openshift.io/bindable': 'false',
          'name.os.template.kubevirt.io/silverblue29': 'Fedora Silverblue 29',
          tags: 'kubevirt,virtualmachine,fedora,rhel',
          validations:
            '[\n  {\n    "name": "minimal-required-memory",\n    "path": "jsonpath::.spec.domain.resources.requests.memory",\n    "rule": "integer",\n    "message": "This VM requires more memory.",\n    "min": 1073741824\n  }\n]\n',
          description:
            'This template can be used to create a VM suitable for Fedora 23 and newer. The template assumes that a PVC is available which is providing the necessary Fedora disk image.\nRecommended disk image (needs to be converted to raw) https://download.fedoraproject.org/pub/fedora/linux/releases/30/Cloud/x86_64/images/Fedora-Cloud-Base-30-1.2.x86_64.qcow2',
          'openshift.io/support-url': 'https://github.com/kubevirt/common-templates/issues',
          iconClass: 'icon-fedora',
          'openshift.io/provider-display-name': 'KubeVirt',
        },
        selfLink:
          '/apis/template.openshift.io/v1/namespaces/openshift/templates/fedora-server-tiny-v0.7.0',
        resourceVersion: '31945',
        name: 'fedora-server-tiny-v0.7.0',
        uid: '2b354e0d-08a0-476d-a852-c452e8ef5707',
        creationTimestamp: '2020-03-19T06:22:41Z',
        namespace: 'openshift',
        ownerReferences: [
          {
            apiVersion: 'kubevirt.io/v1',
            kind: 'KubevirtCommonTemplatesBundle',
            name: 'common-templates-kubevirt-hyperconverged',
            uid: 'a2e92d8f-b430-48da-8148-681f1659ca6f',
          },
        ],
        labels: {
          'flavor.template.kubevirt.io/tiny': 'true',
          'template.kubevirt.io/version': 'v0.8.2',
          'os.template.kubevirt.io/fedora29': 'true',
          'os.template.kubevirt.io/silverblue30': 'true',
          'template.kubevirt.io/type': 'base',
          'os.template.kubevirt.io/silverblue31': 'true',
          'os.template.kubevirt.io/silverblue29': 'true',
          'workload.template.kubevirt.io/server': 'true',
          'os.template.kubevirt.io/fedora30': 'true',
          'os.template.kubevirt.io/fedora31': 'true',
        },
      },
    },
  ],
  filters: {},
  kind: 'Template',
  loadError: '',
  loaded: true,
  selected: null,
};

export const kubevirtResources = {
  deploymentConfigs,
  deployments,
  daemonSets,
  pods,
  replicationControllers,
  routes,
  services,
  replicaSets,
  buildConfigs,
  builds,
  statefulSets,
  secrets,
  clusterServiceVersions,
  virtualmachines,
  virtualmachineinstances,
  virtualmachinetemplates,
  migrations,
};
