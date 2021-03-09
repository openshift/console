import { ImagePullPolicy } from '@console/internal/module/k8s';
import { TopologyDataResources } from '../topology-types';

export const MockGraphResources: TopologyDataResources = {
  deploymentConfigs: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'deploymentconfig',
        metadata: {
          annotations: {
            'app.openshift.io/connects-to': 'mysql',
            description: 'Defines how to deploy the application server',
            'template.alpha.openshift.io/wait-for-ready': 'true',
          },
          resourceVersion: '460792',
          name: 'cakephp-mysql-example',
          uid: '86ddea2d-ddf4-11e9-b72f-0a580a810024',
          creationTimestamp: '2019-09-23T11:23:11Z',
          generation: 1,
          namespace: 'jeff-project',
          labels: {
            app: 'cakephp-mysql-example',
            'app.kubernetes.io/part-of': 'application-1',
            template: 'cakephp-mysql-example',
            'template.openshift.io/template-instance-owner': '86b6b79a-ddf4-11e9-a662-0a580a820020',
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
                  namespace: 'jeff-project',
                  name: 'cakephp-mysql-example:latest',
                },
              },
            },
            { type: 'ConfigChange' },
          ],
          replicas: 1,
          revisionHistoryLimit: 10,
          test: false,
          selector: { name: 'cakephp-mysql-example' },
          template: {
            metadata: {
              name: 'cakephp-mysql-example',
              creationTimestamp: null,
              labels: { name: 'cakephp-mysql-example' },
            },
            spec: {
              containers: [
                {
                  resources: { limits: { memory: '512Mi' } },
                  readinessProbe: {
                    httpGet: { path: '/health.php', port: 8080, scheme: 'HTTP' },
                    initialDelaySeconds: 3,
                    timeoutSeconds: 3,
                    periodSeconds: 60,
                    successThreshold: 1,
                    failureThreshold: 3,
                  },
                  terminationMessagePath: '/dev/termination-log',
                  name: 'cakephp-mysql-example',
                  livenessProbe: {
                    httpGet: { path: '/health.php', port: 8080, scheme: 'HTTP' },
                    initialDelaySeconds: 30,
                    timeoutSeconds: 3,
                    periodSeconds: 60,
                    successThreshold: 1,
                    failureThreshold: 3,
                  },
                  env: [
                    { name: 'DATABASE_SERVICE_NAME', value: 'mysql' },
                    { name: 'DATABASE_ENGINE', value: 'mysql' },
                    { name: 'DATABASE_NAME', value: 'default' },
                    {
                      name: 'DATABASE_USER',
                      valueFrom: {
                        secretKeyRef: { name: 'cakephp-mysql-example', key: 'database-user' },
                      },
                    },
                    {
                      name: 'DATABASE_PASSWORD',
                      valueFrom: {
                        secretKeyRef: { name: 'cakephp-mysql-example', key: 'database-password' },
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
                    { name: 'OPCACHE_REVALIDATE_FREQ', value: '2' },
                  ],
                  ports: [{ containerPort: 8080, protocol: 'TCP' }],
                  imagePullPolicy: ImagePullPolicy.IfNotPresent,
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
              lastUpdateTime: '2019-09-23T11:23:11Z',
              lastTransitionTime: '2019-09-23T11:23:11Z',
              message: 'Deployment config does not have minimum availability.',
            },
          ],
        },
      },
      {
        kind: 'deploymentconfig',
        metadata: {
          annotations: { description: 'Defines how to deploy the application server' },
          resourceVersion: '17190',
          name: 'dotnet-example',
          uid: '7f4ffb69-ddf4-11e9-b72f-0a580a810024',
          creationTimestamp: '2019-09-23T11:22:58Z',
          generation: 1,
          namespace: 'jeff-project',
          labels: {
            'app.kubernetes.io/part-of': 'application-1',
            'template.openshift.io/template-instance-owner': '7f25e822-ddf4-11e9-a662-0a580a820020',
          },
        },
        spec: {
          strategy: {
            type: 'Rolling',
            rollingParams: {
              updatePeriodSeconds: 1,
              intervalSeconds: 1,
              timeoutSeconds: 600,
              maxUnavailable: '25%',
              maxSurge: '25%',
            },
            resources: {},
            activeDeadlineSeconds: 21600,
          },
          triggers: [
            {
              type: 'ImageChange',
              imageChangeParams: {
                automatic: true,
                containerNames: ['dotnet-app'],
                from: {
                  kind: 'ImageStreamTag',
                  namespace: 'jeff-project',
                  name: 'dotnet-example:latest',
                },
              },
            },
            { type: 'ConfigChange' },
          ],
          replicas: 1,
          revisionHistoryLimit: 10,
          test: false,
          selector: { name: 'dotnet-example' },
          template: {
            metadata: {
              name: 'dotnet-example',
              creationTimestamp: null,
              labels: { name: 'dotnet-example' },
            },
            spec: {
              containers: [
                {
                  resources: { limits: { memory: '128Mi' } },
                  readinessProbe: {
                    httpGet: { path: '/', port: 8080, scheme: 'HTTP' },
                    initialDelaySeconds: 10,
                    timeoutSeconds: 30,
                    periodSeconds: 10,
                    successThreshold: 1,
                    failureThreshold: 3,
                  },
                  terminationMessagePath: '/dev/termination-log',
                  name: 'dotnet-app',
                  livenessProbe: {
                    httpGet: { path: '/', port: 8080, scheme: 'HTTP' },
                    initialDelaySeconds: 40,
                    timeoutSeconds: 15,
                    periodSeconds: 10,
                    successThreshold: 1,
                    failureThreshold: 3,
                  },
                  ports: [{ containerPort: 8080, protocol: 'TCP' }],
                  imagePullPolicy: ImagePullPolicy.IfNotPresent,
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
              lastUpdateTime: '2019-09-23T11:22:59Z',
              lastTransitionTime: '2019-09-23T11:22:59Z',
              message: 'Deployment config does not have minimum availability.',
            },
          ],
        },
      },
      {
        kind: 'deploymentconfig',
        metadata: {
          annotations: {
            'app.openshift.io/connects-to': 'perl',
            description: 'Defines how to deploy the database',
            'template.alpha.openshift.io/wait-for-ready': 'true',
          },
          resourceVersion: '460861',
          name: 'mysql',
          uid: '86e228cb-ddf4-11e9-a662-0a580a820020',
          creationTimestamp: '2019-09-23T11:23:11Z',
          generation: 1,
          namespace: 'jeff-project',
          labels: {
            app: 'cakephp-mysql-example',
            'app.kubernetes.io/part-of': 'application-2',
            template: 'cakephp-mysql-example',
            'template.openshift.io/template-instance-owner': '86b6b79a-ddf4-11e9-a662-0a580a820020',
          },
        },
        spec: {
          strategy: {
            type: 'Recreate',
            recreateParams: { timeoutSeconds: 600 },
            resources: {},
            activeDeadlineSeconds: 21600,
          },
          triggers: [
            {
              type: 'ImageChange',
              imageChangeParams: {
                automatic: true,
                containerNames: ['mysql'],
                from: { kind: 'ImageStreamTag', namespace: 'openshift', name: 'mysql:5.7' },
              },
            },
            { type: 'ConfigChange' },
          ],
          replicas: 1,
          revisionHistoryLimit: 10,
          test: false,
          selector: { name: 'mysql' },
          template: {
            metadata: { name: 'mysql', creationTimestamp: null, labels: { name: 'mysql' } },
            spec: {
              volumes: [{ name: 'data', emptyDir: {} }],
              containers: [
                {
                  resources: { limits: { memory: '512Mi' } },
                  readinessProbe: {
                    exec: {
                      command: [
                        '/bin/sh',
                        '-i',
                        '-c',
                        "MYSQL_PWD='Wrqbxggbr4mFYGQX' mysql -h 127.0.0.1 -u cakephp -D default -e 'SELECT 1'",
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
                    tcpSocket: { port: 3306 },
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
                        secretKeyRef: { name: 'cakephp-mysql-example', key: 'database-user' },
                      },
                    },
                    {
                      name: 'MYSQL_PASSWORD',
                      valueFrom: {
                        secretKeyRef: { name: 'cakephp-mysql-example', key: 'database-password' },
                      },
                    },
                    { name: 'MYSQL_DATABASE', value: 'default' },
                  ],
                  ports: [{ containerPort: 3306, protocol: 'TCP' }],
                  imagePullPolicy: ImagePullPolicy.IfNotPresent,
                  volumeMounts: [{ name: 'data', mountPath: '/var/lib/mysql/data' }],
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
              lastUpdateTime: '2019-09-23T11:23:11Z',
              lastTransitionTime: '2019-09-23T11:23:11Z',
              message: 'Deployment config does not have minimum availability.',
            },
          ],
        },
      },
      {
        kind: 'deploymentconfig',
        metadata: {
          annotations: { 'openshift.io/generated-by': 'OpenShiftWebConsole' },
          resourceVersion: '29644',
          name: 'perl',
          uid: 'b69703c0-ddf9-11e9-b72f-0a580a810024',
          creationTimestamp: '2019-09-23T12:00:19Z',
          generation: 2,
          namespace: 'jeff-project',
          labels: {
            app: 'perl',
            'app.kubernetes.io/component': 'perl',
            'app.kubernetes.io/instance': 'perl',
          },
        },
        spec: {
          strategy: {
            type: 'Rolling',
            rollingParams: {
              updatePeriodSeconds: 1,
              intervalSeconds: 1,
              timeoutSeconds: 600,
              maxUnavailable: '25%',
              maxSurge: '25%',
            },
            resources: {},
            activeDeadlineSeconds: 21600,
          },
          triggers: [
            {
              type: 'ImageChange',
              imageChangeParams: {
                automatic: true,
                containerNames: ['perl'],
                from: { kind: 'ImageStreamTag', namespace: 'jeff-project', name: 'perl:latest' },
                lastTriggeredImage:
                  'perl@sha256:711837fda379e492e351c0379ab697effc7e9c61dac2bef731073ac1138baad1',
              },
            },
            { type: 'ConfigChange' },
          ],
          replicas: 1,
          revisionHistoryLimit: 10,
          test: false,
          selector: { app: 'perl', deploymentconfig: 'perl' },
          template: {
            metadata: {
              creationTimestamp: null,
              labels: { app: 'perl', deploymentconfig: 'perl' },
              annotations: { 'openshift.io/generated-by': 'OpenShiftWebConsole' },
            },
            spec: {
              containers: [
                {
                  name: 'perl',
                  image:
                    'perl@sha256:711837fda379e492e351c0379ab697effc7e9c61dac2bef731073ac1138baad1',
                  ports: [{ containerPort: 8080, protocol: 'TCP' }],
                  resources: {},
                  terminationMessagePath: '/dev/termination-log',
                  terminationMessagePolicy: 'File',
                  imagePullPolicy: ImagePullPolicy.IfNotPresent,
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
          latestVersion: 1,
          observedGeneration: 2,
          replicas: 0,
          updatedReplicas: 0,
          availableReplicas: 0,
          unavailableReplicas: 0,
          details: { message: 'config change', causes: [{ type: 'ConfigChange' }] },
          conditions: [
            {
              type: 'Available',
              status: 'False',
              lastUpdateTime: '2019-09-23T12:00:19Z',
              lastTransitionTime: '2019-09-23T12:00:19Z',
              message: 'Deployment config does not have minimum availability.',
            },
            {
              type: 'Progressing',
              status: 'False',
              lastUpdateTime: '2019-09-23T12:10:32Z',
              lastTransitionTime: '2019-09-23T12:10:32Z',
              reason: 'ProgressDeadlineExceeded',
              message: 'replication controller "perl-1" has failed progressing',
            },
          ],
        },
      },
    ],
  },
  deployments: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'Deployment',
        apiVersion: 'apps/v1',
        metadata: {
          annotations: { 'deployment.kubernetes.io/revision': '1' },
          resourceVersion: '471849',
          name: 'test-deployment-1',
          uid: '64b34874-debd-11e9-8cdf-0a0700ae5e38',
          creationTimestamp: '2019-09-24T11:21:03Z',
          generation: 4,
          namespace: 'jeff-project',
          labels: { 'app.kubernetes.io/part-of': 'application-3' },
        },
        spec: {
          replicas: 6,
          selector: { matchLabels: { app: 'hello-openshift' } },
          template: {
            metadata: { creationTimestamp: null, labels: { app: 'hello-openshift' } },
            spec: {
              containers: [
                {
                  name: 'hello-openshift',
                  image: 'openshift/hello-openshift',
                  ports: [{ containerPort: 8080, protocol: 'TCP' }],
                  resources: {},
                  terminationMessagePath: '/dev/termination-log',
                  terminationMessagePolicy: 'File',
                  imagePullPolicy: ImagePullPolicy.Always,
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
            rollingUpdate: { maxUnavailable: '25%', maxSurge: '25%' },
          },
          revisionHistoryLimit: 10,
          progressDeadlineSeconds: 600,
        },
        status: {
          observedGeneration: 4,
          replicas: 6,
          updatedReplicas: 6,
          readyReplicas: 6,
          availableReplicas: 6,
          conditions: [
            {
              type: 'Progressing',
              status: 'True',
              lastUpdateTime: '2019-09-24T11:21:14Z',
              lastTransitionTime: '2019-09-24T11:21:03Z',
              reason: 'NewReplicaSetAvailable',
              message: 'ReplicaSet "test-deployment-1-54b47fbb75" has successfully progressed.',
            },
            {
              type: 'Available',
              status: 'True',
              lastUpdateTime: '2019-09-24T11:24:57Z',
              lastTransitionTime: '2019-09-24T11:24:57Z',
              reason: 'MinimumReplicasAvailable',
              message: 'Deployment has minimum availability.',
            },
          ],
        },
      },
    ],
  },
  daemonSets: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'daemonset',
        metadata: {
          annotations: {
            'app.openshift.io/connects-to': 'test-deployment-1',
            'deprecated.daemonset.template.generation': '1',
          },
          resourceVersion: '471360',
          name: 'test-daemonset-1',
          uid: '909bc726-debd-11e9-b95e-02de4f087472',
          creationTimestamp: '2019-09-24T11:22:16Z',
          generation: 1,
          namespace: 'jeff-project',
          labels: { 'app.kubernetes.io/part-of': 'application-2' },
        },
        spec: {
          selector: { matchLabels: { app: 'hello-openshift' } },
          template: {
            metadata: { creationTimestamp: null, labels: { app: 'hello-openshift' } },
            spec: {
              containers: [
                {
                  name: 'hello-openshift',
                  image: 'openshift/hello-openshift',
                  ports: [{ containerPort: 8080, protocol: 'TCP' }],
                  resources: {},
                  terminationMessagePath: '/dev/termination-log',
                  terminationMessagePolicy: 'File',
                  imagePullPolicy: ImagePullPolicy.Always,
                },
              ],
              restartPolicy: 'Always',
              terminationGracePeriodSeconds: 30,
              dnsPolicy: 'ClusterFirst',
              securityContext: {},
              schedulerName: 'default-scheduler',
            },
          },
          updateStrategy: { type: 'RollingUpdate', rollingUpdate: { maxUnavailable: 1 } },
          revisionHistoryLimit: 10,
        },
        status: {
          currentNumberScheduled: 3,
          numberMisscheduled: 0,
          desiredNumberScheduled: 3,
          numberReady: 3,
          observedGeneration: 1,
          updatedNumberScheduled: 3,
          numberAvailable: 3,
        },
      },
    ],
  },
  pods: {
    loaded: true,
    loadError: '',
    data: [
      {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          generateName: 'test-deployment-1-54b47fbb75-',
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status':
              '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.20"\n    ],\n    "default": true,\n    "dns": {}\n}]',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '470619',
          name: 'test-deployment-1-54b47fbb75-d4sg7',
          uid: '64b9cf32-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:21:03Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'ReplicaSet',
              name: 'test-deployment-1-54b47fbb75',
              uid: '64b4abd7-debd-11e9-b22b-06b197463f30',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: { app: 'hello-openshift', 'pod-template-hash': '54b47fbb75' },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          terminationGracePeriodSeconds: 30,
          nodeName: 'ip-10-0-146-80.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'hello-openshift',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.Always,
              volumeMounts: [
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'openshift/hello-openshift',
            },
          ],
          serviceAccount: 'default',
          volumes: [
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
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
          phase: 'Running',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:03Z',
            },
            {
              type: 'Ready',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:13Z',
            },
            {
              type: 'ContainersReady',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:13Z',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:03Z',
            },
          ],
          hostIP: '10.0.146.80',
          podIP: '10.128.2.20',
          startTime: '2019-09-24T11:21:03Z',
          containerStatuses: [
            {
              name: 'hello-openshift',
              state: { running: { startedAt: '2019-09-24T11:21:13Z' } },
              lastState: {},
              ready: true,
              restartCount: 0,
              image: 'docker.io/openshift/hello-openshift:latest',
              imageID:
                'docker.io/openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
              containerID:
                'cri-o://2128884957cce2cbb56602e3b029c173dc3c42a7c0629454bfc2868a596111bd',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          generateName: 'test-deployment-1-54b47fbb75-',
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status':
              '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.22"\n    ],\n    "default": true,\n    "dns": {}\n}]',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '471828',
          name: 'test-deployment-1-54b47fbb75-cfrkq',
          uid: 'eb11d324-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:24:48Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'ReplicaSet',
              name: 'test-deployment-1-54b47fbb75',
              uid: '64b4abd7-debd-11e9-b22b-06b197463f30',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: { app: 'hello-openshift', 'pod-template-hash': '54b47fbb75' },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          terminationGracePeriodSeconds: 30,
          nodeName: 'ip-10-0-146-80.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'hello-openshift',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.Always,
              volumeMounts: [
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'openshift/hello-openshift',
            },
          ],
          serviceAccount: 'default',
          volumes: [
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
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
          phase: 'Running',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:48Z',
            },
            {
              type: 'Ready',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:56Z',
            },
            {
              type: 'ContainersReady',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:56Z',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:48Z',
            },
          ],
          hostIP: '10.0.146.80',
          podIP: '10.128.2.22',
          startTime: '2019-09-24T11:24:48Z',
          containerStatuses: [
            {
              name: 'hello-openshift',
              state: { running: { startedAt: '2019-09-24T11:24:56Z' } },
              lastState: {},
              ready: true,
              restartCount: 0,
              image: 'docker.io/openshift/hello-openshift:latest',
              imageID:
                'docker.io/openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
              containerID:
                'cri-o://9e9c7a447ed17f709c11447fbdbd011c260cbbe1004d67dcc1667885ae42de07',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          generateName: 'test-daemonset-1-',
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status':
              '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.128.2.21"\n    ],\n    "default": true,\n    "dns": {}\n}]',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '471027',
          name: 'test-daemonset-1-ngjfn',
          uid: '90a149a4-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:22:16Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'DaemonSet',
              name: 'test-daemonset-1',
              uid: '909bc726-debd-11e9-b95e-02de4f087472',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: {
            app: 'hello-openshift',
            'controller-revision-hash': '54b47fbb75',
            'pod-template-generation': '1',
          },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          affinity: {
            nodeAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: [
                  {
                    matchFields: [
                      {
                        key: 'metadata.name',
                        operator: 'In',
                        values: ['ip-10-0-146-80.us-east-2.compute.internal'],
                      },
                    ],
                  },
                ],
              },
            },
          },
          terminationGracePeriodSeconds: 30,
          nodeName: 'ip-10-0-146-80.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'hello-openshift',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.Always,
              volumeMounts: [
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'openshift/hello-openshift',
            },
          ],
          serviceAccount: 'default',
          volumes: [
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
            },
          ],
          dnsPolicy: 'ClusterFirst',
          tolerations: [
            { key: 'node.kubernetes.io/unschedulable', operator: 'Exists', effect: 'NoSchedule' },
            { key: 'node.kubernetes.io/not-ready', operator: 'Exists', effect: 'NoExecute' },
            { key: 'node.kubernetes.io/unreachable', operator: 'Exists', effect: 'NoExecute' },
            { key: 'node.kubernetes.io/disk-pressure', operator: 'Exists', effect: 'NoSchedule' },
            { key: 'node.kubernetes.io/memory-pressure', operator: 'Exists', effect: 'NoSchedule' },
            { key: 'node.kubernetes.io/pid-pressure', operator: 'Exists', effect: 'NoSchedule' },
          ],
        },
        status: {
          phase: 'Running',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:16Z',
            },
            {
              type: 'Ready',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:25Z',
            },
            {
              type: 'ContainersReady',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:25Z',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:16Z',
            },
          ],
          hostIP: '10.0.146.80',
          podIP: '10.128.2.21',
          startTime: '2019-09-24T11:22:16Z',
          containerStatuses: [
            {
              name: 'hello-openshift',
              state: { running: { startedAt: '2019-09-24T11:22:24Z' } },
              lastState: {},
              ready: true,
              restartCount: 0,
              image: 'docker.io/openshift/hello-openshift:latest',
              imageID:
                'docker.io/openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
              containerID:
                'cri-o://2b026c55fdeef70c73af03d19a5a4dc91b9c809a9c59b9fc8e754f9d3a1c89fd',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          generateName: 'test-daemonset-1-',
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status':
              '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.129.2.20"\n    ],\n    "default": true,\n    "dns": {}\n}]',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '471035',
          name: 'test-daemonset-1-72zfc',
          uid: '90a1d40a-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:22:16Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'DaemonSet',
              name: 'test-daemonset-1',
              uid: '909bc726-debd-11e9-b95e-02de4f087472',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: {
            app: 'hello-openshift',
            'controller-revision-hash': '54b47fbb75',
            'pod-template-generation': '1',
          },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          affinity: {
            nodeAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: [
                  {
                    matchFields: [
                      {
                        key: 'metadata.name',
                        operator: 'In',
                        values: ['ip-10-0-132-222.us-east-2.compute.internal'],
                      },
                    ],
                  },
                ],
              },
            },
          },
          terminationGracePeriodSeconds: 30,
          nodeName: 'ip-10-0-132-222.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'hello-openshift',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.Always,
              volumeMounts: [
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'openshift/hello-openshift',
            },
          ],
          serviceAccount: 'default',
          volumes: [
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
            },
          ],
          dnsPolicy: 'ClusterFirst',
          tolerations: [
            { key: 'node.kubernetes.io/not-ready', operator: 'Exists', effect: 'NoExecute' },
            { key: 'node.kubernetes.io/unreachable', operator: 'Exists', effect: 'NoExecute' },
            { key: 'node.kubernetes.io/disk-pressure', operator: 'Exists', effect: 'NoSchedule' },
            { key: 'node.kubernetes.io/memory-pressure', operator: 'Exists', effect: 'NoSchedule' },
            { key: 'node.kubernetes.io/pid-pressure', operator: 'Exists', effect: 'NoSchedule' },
            { key: 'node.kubernetes.io/unschedulable', operator: 'Exists', effect: 'NoSchedule' },
          ],
        },
        status: {
          phase: 'Running',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:16Z',
            },
            {
              type: 'Ready',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:25Z',
            },
            {
              type: 'ContainersReady',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:25Z',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:16Z',
            },
          ],
          hostIP: '10.0.132.222',
          podIP: '10.129.2.20',
          startTime: '2019-09-24T11:22:16Z',
          containerStatuses: [
            {
              name: 'hello-openshift',
              state: { running: { startedAt: '2019-09-24T11:22:25Z' } },
              lastState: {},
              ready: true,
              restartCount: 0,
              image: 'docker.io/openshift/hello-openshift:latest',
              imageID:
                'docker.io/openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
              containerID:
                'cri-o://c8a01ca3983265a7ff527b9179d44cad9032a6fe9748a890c22327a240bacf80',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status': '',
            'openshift.io/deployment-config.name': 'perl',
            'openshift.io/deployment.name': 'perl-1',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '29637',
          name: 'perl-1-deploy',
          uid: 'b75a3a67-ddf9-11e9-8d63-02de4f087472',
          creationTimestamp: '2019-09-23T12:00:20Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'v1',
              kind: 'ReplicationController',
              name: 'perl-1',
              uid: 'b74b9c2b-ddf9-11e9-8d63-02de4f087472',
            },
          ],
          labels: { 'openshift.io/deployer-pod-for.name': 'perl-1' },
        },
        spec: {
          restartPolicy: 'Never',
          activeDeadlineSeconds: 21600,
          serviceAccountName: 'deployer',
          imagePullSecrets: [{ name: 'deployer-dockercfg-5gd7c' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          terminationGracePeriodSeconds: 10,
          shareProcessNamespace: false,
          nodeName: 'ip-10-0-132-222.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'deployment',
              env: [
                { name: 'OPENSHIFT_DEPLOYMENT_NAME', value: 'perl-1' },
                { name: 'OPENSHIFT_DEPLOYMENT_NAMESPACE', value: 'jeff-project' },
              ],
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              imagePullPolicy: ImagePullPolicy.IfNotPresent,
              volumeMounts: [
                {
                  name: 'deployer-token-x876x',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image:
                'registry.svc.ci.openshift.org/origin/4.2-2019-09-23-102648@sha256:60f9bf5d8a9ec601e099f62a853642bb453bd31427712e43efe6de793b10b869',
            },
          ],
          serviceAccount: 'deployer',
          volumes: [
            {
              name: 'deployer-token-x876x',
              secret: { secretName: 'deployer-token-x876x', defaultMode: 420 },
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
          phase: 'Failed',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-23T12:00:20Z',
            },
            {
              type: 'Ready',
              status: 'False',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-23T12:10:32Z',
              reason: 'ContainersNotReady',
              message: 'containers with unready status: [deployment]',
            },
            {
              type: 'ContainersReady',
              status: 'False',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-23T12:10:32Z',
              reason: 'ContainersNotReady',
              message: 'containers with unready status: [deployment]',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-23T12:00:20Z',
            },
          ],
          hostIP: '10.0.132.222',
          podIP: '10.129.2.11',
          startTime: '2019-09-23T12:00:20Z',
          containerStatuses: [
            {
              name: 'deployment',
              state: {
                terminated: {
                  exitCode: 1,
                  reason: 'Error',
                  startedAt: '2019-09-23T12:00:31Z',
                  finishedAt: '2019-09-23T12:10:32Z',
                  containerID:
                    'cri-o://6b481bc1d2635ea50f69e86f71b32888c750d6493078873efd2c815726daf117',
                },
              },
              lastState: {},
              ready: false,
              restartCount: 0,
              image:
                'registry.svc.ci.openshift.org/origin/4.2-2019-09-23-102648@sha256:60f9bf5d8a9ec601e099f62a853642bb453bd31427712e43efe6de793b10b869',
              imageID:
                'registry.svc.ci.openshift.org/origin/4.2-2019-09-23-102648@sha256:60f9bf5d8a9ec601e099f62a853642bb453bd31427712e43efe6de793b10b869',
              containerID:
                'cri-o://6b481bc1d2635ea50f69e86f71b32888c750d6493078873efd2c815726daf117',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          generateName: 'test-daemonset-1-',
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status':
              '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.131.0.21"\n    ],\n    "default": true,\n    "dns": {}\n}]',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '471041',
          name: 'test-daemonset-1-hpjv7',
          uid: '909f68be-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:22:16Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'DaemonSet',
              name: 'test-daemonset-1',
              uid: '909bc726-debd-11e9-b95e-02de4f087472',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: {
            app: 'hello-openshift',
            'controller-revision-hash': '54b47fbb75',
            'pod-template-generation': '1',
          },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          affinity: {
            nodeAffinity: {
              requiredDuringSchedulingIgnoredDuringExecution: {
                nodeSelectorTerms: [
                  {
                    matchFields: [
                      {
                        key: 'metadata.name',
                        operator: 'In',
                        values: ['ip-10-0-168-116.us-east-2.compute.internal'],
                      },
                    ],
                  },
                ],
              },
            },
          },
          terminationGracePeriodSeconds: 30,
          nodeName: 'ip-10-0-168-116.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'hello-openshift',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.Always,
              volumeMounts: [
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'openshift/hello-openshift',
            },
          ],
          serviceAccount: 'default',
          volumes: [
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
            },
          ],
          dnsPolicy: 'ClusterFirst',
          tolerations: [
            { key: 'node.kubernetes.io/not-ready', operator: 'Exists', effect: 'NoExecute' },
            { key: 'node.kubernetes.io/unreachable', operator: 'Exists', effect: 'NoExecute' },
            { key: 'node.kubernetes.io/disk-pressure', operator: 'Exists', effect: 'NoSchedule' },
            { key: 'node.kubernetes.io/memory-pressure', operator: 'Exists', effect: 'NoSchedule' },
            { key: 'node.kubernetes.io/pid-pressure', operator: 'Exists', effect: 'NoSchedule' },
            { key: 'node.kubernetes.io/unschedulable', operator: 'Exists', effect: 'NoSchedule' },
          ],
        },
        status: {
          phase: 'Running',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:16Z',
            },
            {
              type: 'Ready',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:26Z',
            },
            {
              type: 'ContainersReady',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:26Z',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:22:16Z',
            },
          ],
          hostIP: '10.0.168.116',
          podIP: '10.131.0.21',
          startTime: '2019-09-24T11:22:16Z',
          containerStatuses: [
            {
              name: 'hello-openshift',
              state: { running: { startedAt: '2019-09-24T11:22:25Z' } },
              lastState: {},
              ready: true,
              restartCount: 0,
              image: 'docker.io/openshift/hello-openshift:latest',
              imageID:
                'docker.io/openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
              containerID:
                'cri-o://6b34a4e1e6f25ae6e763b144087bedd88cd021c4aca944a2b4ecbe223f79e8d8',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          generateName: 'test-deployment-1-54b47fbb75-',
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status':
              '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.131.0.22"\n    ],\n    "default": true,\n    "dns": {}\n}]',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '471840',
          name: 'test-deployment-1-54b47fbb75-rbf4d',
          uid: 'eb44c495-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:24:48Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'ReplicaSet',
              name: 'test-deployment-1-54b47fbb75',
              uid: '64b4abd7-debd-11e9-b22b-06b197463f30',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: { app: 'hello-openshift', 'pod-template-hash': '54b47fbb75' },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          terminationGracePeriodSeconds: 30,
          nodeName: 'ip-10-0-168-116.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'hello-openshift',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.Always,
              volumeMounts: [
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'openshift/hello-openshift',
            },
          ],
          serviceAccount: 'default',
          volumes: [
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
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
          phase: 'Running',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:48Z',
            },
            {
              type: 'Ready',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:57Z',
            },
            {
              type: 'ContainersReady',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:57Z',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:48Z',
            },
          ],
          hostIP: '10.0.168.116',
          podIP: '10.131.0.22',
          startTime: '2019-09-24T11:24:48Z',
          containerStatuses: [
            {
              name: 'hello-openshift',
              state: { running: { startedAt: '2019-09-24T11:24:57Z' } },
              lastState: {},
              ready: true,
              restartCount: 0,
              image: 'docker.io/openshift/hello-openshift:latest',
              imageID:
                'docker.io/openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
              containerID:
                'cri-o://1a2b19fa9691675191f04122f68365a9fff51073a8e7b563e3cef8d6d6c9b0dc',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          generateName: 'test-statefulset-1-',
          annotations: { 'openshift.io/scc': 'restricted' },
          resourceVersion: '470712',
          name: 'test-statefulset-1-0',
          uid: '75c306e4-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:21:31Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'StatefulSet',
              name: 'test-statefulset-1',
              uid: '75c049b5-debd-11e9-8cdf-0a0700ae5e38',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: {
            app: 'nginx',
            'controller-revision-hash': 'test-statefulset-1-7d57df7bfc',
            'statefulset.kubernetes.io/pod-name': 'test-statefulset-1-0',
          },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          subdomain: 'nginx',
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          terminationGracePeriodSeconds: 10,
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'nginx',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ name: 'web', containerPort: 80, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.IfNotPresent,
              volumeMounts: [
                { name: 'www', mountPath: '/usr/share/nginx/html' },
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'gcr.io/google_containers/nginx-slim:0.8',
            },
          ],
          hostname: 'test-statefulset-1-0',
          serviceAccount: 'default',
          volumes: [
            { name: 'www', persistentVolumeClaim: { claimName: 'www-test-statefulset-1-0' } },
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
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
              type: 'PodScheduled',
              status: 'False',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:31Z',
              reason: 'Unschedulable',
              message: 'pod has unbound immediate PersistentVolumeClaims (repeated 3 times)',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        kind: 'Pod',
        apiVersion: 'v1',
        metadata: {
          generateName: 'test-deployment-1-54b47fbb75-',
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status':
              '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.129.2.21"\n    ],\n    "default": true,\n    "dns": {}\n}]',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '471846',
          name: 'test-deployment-1-54b47fbb75-whl8h',
          uid: 'eb264e6e-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:24:48Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'ReplicaSet',
              name: 'test-deployment-1-54b47fbb75',
              uid: '64b4abd7-debd-11e9-b22b-06b197463f30',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: { app: 'hello-openshift', 'pod-template-hash': '54b47fbb75' },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          terminationGracePeriodSeconds: 30,
          nodeName: 'ip-10-0-132-222.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'hello-openshift',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.Always,
              volumeMounts: [
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'openshift/hello-openshift',
            },
          ],
          serviceAccount: 'default',
          volumes: [
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
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
          phase: 'Running',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:48Z',
            },
            {
              type: 'Ready',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:57Z',
            },
            {
              type: 'ContainersReady',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:57Z',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:24:48Z',
            },
          ],
          hostIP: '10.0.132.222',
          podIP: '10.129.2.21',
          startTime: '2019-09-24T11:24:48Z',
          containerStatuses: [
            {
              name: 'hello-openshift',
              state: { running: { startedAt: '2019-09-24T11:24:57Z' } },
              lastState: {},
              ready: true,
              restartCount: 0,
              image: 'docker.io/openshift/hello-openshift:latest',
              imageID:
                'docker.io/openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
              containerID:
                'cri-o://5c01809dcde7fd1caf8b440fc4d3591ed08607a1ac20701e299103c2b25ce9b8',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          generateName: 'test-deployment-1-54b47fbb75-',
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status':
              '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.129.2.19"\n    ],\n    "default": true,\n    "dns": {}\n}]',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '470632',
          name: 'test-deployment-1-54b47fbb75-jfxdt',
          uid: '64ba1932-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:21:03Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'ReplicaSet',
              name: 'test-deployment-1-54b47fbb75',
              uid: '64b4abd7-debd-11e9-b22b-06b197463f30',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: { app: 'hello-openshift', 'pod-template-hash': '54b47fbb75' },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          terminationGracePeriodSeconds: 30,
          nodeName: 'ip-10-0-132-222.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'hello-openshift',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.Always,
              volumeMounts: [
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'openshift/hello-openshift',
            },
          ],
          serviceAccount: 'default',
          volumes: [
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
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
          phase: 'Running',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:03Z',
            },
            {
              type: 'Ready',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:14Z',
            },
            {
              type: 'ContainersReady',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:14Z',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:03Z',
            },
          ],
          hostIP: '10.0.132.222',
          podIP: '10.129.2.19',
          startTime: '2019-09-24T11:21:03Z',
          containerStatuses: [
            {
              name: 'hello-openshift',
              state: { running: { startedAt: '2019-09-24T11:21:13Z' } },
              lastState: {},
              ready: true,
              restartCount: 0,
              image: 'docker.io/openshift/hello-openshift:latest',
              imageID:
                'docker.io/openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
              containerID:
                'cri-o://1b5cff087c7f6145d8fc422f1a474b869860eb8bfd68e3c5db85722d034aabf9',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
      {
        apiVersion: 'v1',
        kind: 'Pod',
        metadata: {
          generateName: 'test-deployment-1-54b47fbb75-',
          annotations: {
            'k8s.v1.cni.cncf.io/networks-status':
              '[{\n    "name": "openshift-sdn",\n    "interface": "eth0",\n    "ips": [\n        "10.131.0.20"\n    ],\n    "default": true,\n    "dns": {}\n}]',
            'openshift.io/scc': 'restricted',
          },
          resourceVersion: '470626',
          name: 'test-deployment-1-54b47fbb75-7s8ct',
          uid: '64b786cf-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:21:03Z',
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'ReplicaSet',
              name: 'test-deployment-1-54b47fbb75',
              uid: '64b4abd7-debd-11e9-b22b-06b197463f30',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: { app: 'hello-openshift', 'pod-template-hash': '54b47fbb75' },
        },
        spec: {
          restartPolicy: 'Always',
          serviceAccountName: 'default',
          imagePullSecrets: [{ name: 'default-dockercfg-zch2x' }],
          priority: 0,
          schedulerName: 'default-scheduler',
          enableServiceLinks: true,
          terminationGracePeriodSeconds: 30,
          nodeName: 'ip-10-0-168-116.us-east-2.compute.internal',
          securityContext: { seLinuxOptions: { level: 's0:c23,c7' }, fsGroup: 1000520000 },
          containers: [
            {
              resources: {},
              terminationMessagePath: '/dev/termination-log',
              name: 'hello-openshift',
              securityContext: {
                capabilities: { drop: ['KILL', 'MKNOD', 'SETGID', 'SETUID'] },
                runAsUser: 1000520000,
              },
              ports: [{ containerPort: 8080, protocol: 'TCP' }],
              imagePullPolicy: ImagePullPolicy.Always,
              volumeMounts: [
                {
                  name: 'default-token-5ffs4',
                  readOnly: true,
                  mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
                },
              ],
              terminationMessagePolicy: 'File',
              image: 'openshift/hello-openshift',
            },
          ],
          serviceAccount: 'default',
          volumes: [
            {
              name: 'default-token-5ffs4',
              secret: { secretName: 'default-token-5ffs4', defaultMode: 420 },
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
          phase: 'Running',
          conditions: [
            {
              type: 'Initialized',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:03Z',
            },
            {
              type: 'Ready',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:13Z',
            },
            {
              type: 'ContainersReady',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:13Z',
            },
            {
              type: 'PodScheduled',
              status: 'True',
              lastProbeTime: null,
              lastTransitionTime: '2019-09-24T11:21:03Z',
            },
          ],
          hostIP: '10.0.168.116',
          podIP: '10.131.0.20',
          startTime: '2019-09-24T11:21:03Z',
          containerStatuses: [
            {
              name: 'hello-openshift',
              state: { running: { startedAt: '2019-09-24T11:21:13Z' } },
              lastState: {},
              ready: true,
              restartCount: 0,
              image: 'docker.io/openshift/hello-openshift:latest',
              imageID:
                'docker.io/openshift/hello-openshift@sha256:aaea76ff622d2f8bcb32e538e7b3cd0ef6d291953f3e7c9f556c1ba5baf47e2e',
              containerID:
                'cri-o://9286a37bb9880c398c31afb89f5a73ebc7e9361b3e2fe46d021d83df0bba3df0',
            },
          ],
          qosClass: 'BestEffort',
        },
      },
    ],
  },
  replicationControllers: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'replicationcontroller',
        metadata: {
          annotations: {
            'openshift.io/deployment-config.name': 'perl',
            'openshift.io/deployer-pod.completed-at': '2019-09-23 12:10:32 +0000 UTC',
            'openshift.io/deployment.phase': 'Failed',
            'openshift.io/deployer-pod.created-at': '2019-09-23 12:00:20 +0000 UTC',
            'openshift.io/deployment-config.latest-version': '1',
            'openshift.io/deployment.status-reason': 'config change',
            'kubectl.kubernetes.io/desired-replicas': '1',
            'openshift.io/deployment.replicas': '0',
            'openshift.io/encoded-deployment-config':
              '{"kind":"DeploymentConfig","apiVersion":"apps.openshift.io/v1","metadata":{"name":"perl","namespace":"jeff-project","uid":"b69703c0-ddf9-11e9-b72f-0a580a810024","resourceVersion":"26857","generation":2,"creationTimestamp":"2019-09-23T12:00:19Z","labels":{"app":"perl","app.kubernetes.io/component":"perl","app.kubernetes.io/instance":"perl"},"annotations":{"openshift.io/generated-by":"OpenShiftWebConsole"}},"spec":{"strategy":{"type":"Rolling","rollingParams":{"updatePeriodSeconds":1,"intervalSeconds":1,"timeoutSeconds":600,"maxUnavailable":"25%","maxSurge":"25%"},"resources":{},"activeDeadlineSeconds":21600},"triggers":[{"type":"ImageChange","imageChangeParams":{"automatic":true,"containerNames":["perl"],"from":{"kind":"ImageStreamTag","namespace":"jeff-project","name":"perl:latest"},"lastTriggeredImage":"perl@sha256:711837fda379e492e351c0379ab697effc7e9c61dac2bef731073ac1138baad1"}},{"type":"ConfigChange"}],"replicas":1,"revisionHistoryLimit":10,"test":false,"selector":{"app":"perl","deploymentconfig":"perl"},"template":{"metadata":{"creationTimestamp":null,"labels":{"app":"perl","deploymentconfig":"perl"},"annotations":{"openshift.io/generated-by":"OpenShiftWebConsole"}},"spec":{"containers":[{"name":"perl","image":"perl@sha256:711837fda379e492e351c0379ab697effc7e9c61dac2bef731073ac1138baad1","ports":[{"containerPort":8080,"protocol":"TCP"}],"resources":{},"terminationMessagePath":"/dev/termination-log","terminationMessagePolicy":"File","imagePullPolicy":"IfNotPresent"}],"restartPolicy":"Always","terminationGracePeriodSeconds":30,"dnsPolicy":"ClusterFirst","securityContext":{},"schedulerName":"default-scheduler"}}},"status":{"latestVersion":1,"observedGeneration":1,"replicas":0,"updatedReplicas":0,"availableReplicas":0,"unavailableReplicas":0,"details":{"message":"config change","causes":[{"type":"ConfigChange"}]},"conditions":[{"type":"Available","status":"False","lastUpdateTime":"2019-09-23T12:00:19Z","lastTransitionTime":"2019-09-23T12:00:19Z","message":"Deployment config does not have minimum availability."}]}}\n',
            'openshift.io/deployer-pod.name': 'perl-1-deploy',
          },
          resourceVersion: '29639',
          name: 'perl-1',
          uid: 'b74b9c2b-ddf9-11e9-8d63-02de4f087472',
          creationTimestamp: '2019-09-23T12:00:20Z',
          generation: 3,
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps.openshift.io/v1',
              kind: 'DeploymentConfig',
              name: 'perl',
              uid: 'b69703c0-ddf9-11e9-b72f-0a580a810024',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: {
            app: 'perl',
            'app.kubernetes.io/component': 'perl',
            'app.kubernetes.io/instance': 'perl',
            'openshift.io/deployment-config.name': 'perl',
          },
        },
        spec: {
          replicas: 0,
          selector: { app: 'perl', deployment: 'perl-1', deploymentconfig: 'perl' },
          template: {
            metadata: {
              creationTimestamp: null,
              labels: { app: 'perl', deployment: 'perl-1', deploymentconfig: 'perl' },
              annotations: {
                'openshift.io/deployment-config.latest-version': '1',
                'openshift.io/deployment-config.name': 'perl',
                'openshift.io/deployment.name': 'perl-1',
                'openshift.io/generated-by': 'OpenShiftWebConsole',
              },
            },
            spec: {
              containers: [
                {
                  name: 'perl',
                  image:
                    'perl@sha256:711837fda379e492e351c0379ab697effc7e9c61dac2bef731073ac1138baad1',
                  ports: [{ containerPort: 8080, protocol: 'TCP' }],
                  resources: {},
                  terminationMessagePath: '/dev/termination-log',
                  terminationMessagePolicy: 'File',
                  imagePullPolicy: ImagePullPolicy.IfNotPresent,
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
        status: { replicas: 0, observedGeneration: 3 },
      },
    ],
  },
  routes: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'route',
        metadata: {
          name: 'cakephp-mysql-example',
          namespace: 'jeff-project',
          uid: '86d5f6f5-ddf4-11e9-a662-0a580a820020',
          resourceVersion: '17026',
          creationTimestamp: '2019-09-23T11:23:11Z',
          labels: {
            app: 'cakephp-mysql-example',
            template: 'cakephp-mysql-example',
            'template.openshift.io/template-instance-owner': '86b6b79a-ddf4-11e9-a662-0a580a820020',
          },
          annotations: { 'openshift.io/host.generated': 'true' },
        },
        spec: {
          host: 'cakephp-mysql-example-jeff-project.apps.jsp002.devcluster.openshift.com',
          subdomain: '',
          to: { kind: 'Service', name: 'cakephp-mysql-example', weight: 100 },
          wildcardPolicy: 'None',
        },
        status: {
          ingress: [
            {
              host: 'cakephp-mysql-example-jeff-project.apps.jsp002.devcluster.openshift.com',
              routerName: 'default',
              conditions: [
                { type: 'Admitted', status: 'True', lastTransitionTime: '2019-09-23T11:23:11Z' },
              ],
              wildcardPolicy: 'None',
              routerCanonicalHostname: 'apps.jsp002.devcluster.openshift.com',
            },
          ],
        },
      },
      {
        kind: 'route',
        metadata: {
          name: 'dotnet-example',
          namespace: 'jeff-project',
          uid: '7f419151-ddf4-11e9-a662-0a580a820020',
          resourceVersion: '16945',
          creationTimestamp: '2019-09-23T11:22:58Z',
          labels: {
            'template.openshift.io/template-instance-owner': '7f25e822-ddf4-11e9-a662-0a580a820020',
          },
          annotations: { 'openshift.io/host.generated': 'true' },
        },
        spec: {
          host: 'dotnet-example-jeff-project.apps.jsp002.devcluster.openshift.com',
          subdomain: '',
          to: { kind: 'Service', name: 'dotnet-example', weight: 100 },
          wildcardPolicy: 'None',
        },
        status: {
          ingress: [
            {
              host: 'dotnet-example-jeff-project.apps.jsp002.devcluster.openshift.com',
              routerName: 'default',
              conditions: [
                { type: 'Admitted', status: 'True', lastTransitionTime: '2019-09-23T11:22:59Z' },
              ],
              wildcardPolicy: 'None',
              routerCanonicalHostname: 'apps.jsp002.devcluster.openshift.com',
            },
          ],
        },
      },
      {
        kind: 'route',
        metadata: {
          name: 'perl',
          namespace: 'jeff-project',
          uid: 'b69e6da1-ddf9-11e9-b981-0a580a800015',
          resourceVersion: '26846',
          creationTimestamp: '2019-09-23T12:00:19Z',
          labels: {
            app: 'perl',
            'app.kubernetes.io/component': 'perl',
            'app.kubernetes.io/instance': 'perl',
          },
          annotations: {
            'openshift.io/generated-by': 'OpenShiftWebConsole',
            'openshift.io/host.generated': 'true',
          },
        },
        spec: {
          host: 'perl-jeff-project.apps.jsp002.devcluster.openshift.com',
          subdomain: '',
          to: { kind: 'Service', name: 'perl', weight: 100 },
          port: { targetPort: '8080-tcp' },
          wildcardPolicy: 'None',
        },
        status: {
          ingress: [
            {
              host: 'perl-jeff-project.apps.jsp002.devcluster.openshift.com',
              routerName: 'default',
              conditions: [
                { type: 'Admitted', status: 'True', lastTransitionTime: '2019-09-23T12:00:19Z' },
              ],
              wildcardPolicy: 'None',
              routerCanonicalHostname: 'apps.jsp002.devcluster.openshift.com',
            },
          ],
        },
      },
    ],
  },
  services: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'service',
        metadata: {
          name: 'cakephp-mysql-example',
          namespace: 'jeff-project',
          uid: '86d4216e-ddf4-11e9-8d63-02de4f087472',
          resourceVersion: '17014',
          creationTimestamp: '2019-09-23T11:23:11Z',
          labels: {
            app: 'cakephp-mysql-example',
            template: 'cakephp-mysql-example',
            'template.openshift.io/template-instance-owner': '86b6b79a-ddf4-11e9-a662-0a580a820020',
          },
          annotations: {
            description: 'Exposes and load balances the application pods',
            'service.alpha.openshift.io/dependencies': '[{"name": "mysql", "kind": "Service"}]',
          },
        },
        spec: {
          ports: [{ name: 'web', protocol: 'TCP', port: 8080, targetPort: 8080 }],
          selector: { name: 'cakephp-mysql-example' },
          clusterIP: '172.30.245.103',
          type: 'ClusterIP',
          sessionAffinity: 'None',
        },
        status: { loadBalancer: {} },
      },
      {
        kind: 'service',
        metadata: {
          name: 'dotnet-example',
          namespace: 'jeff-project',
          uid: '7f438a59-ddf4-11e9-8d63-02de4f087472',
          resourceVersion: '16937',
          creationTimestamp: '2019-09-23T11:22:58Z',
          labels: {
            'template.openshift.io/template-instance-owner': '7f25e822-ddf4-11e9-a662-0a580a820020',
          },
          annotations: { description: 'Exposes and load balances the application pods' },
        },
        spec: {
          ports: [{ name: 'web', protocol: 'TCP', port: 8080, targetPort: 8080 }],
          selector: { name: 'dotnet-example' },
          clusterIP: '172.30.96.177',
          type: 'ClusterIP',
          sessionAffinity: 'None',
        },
        status: { loadBalancer: {} },
      },
      {
        kind: 'service',
        metadata: {
          name: 'mysql',
          namespace: 'jeff-project',
          uid: '86df9dbf-ddf4-11e9-8d63-02de4f087472',
          resourceVersion: '17021',
          creationTimestamp: '2019-09-23T11:23:11Z',
          labels: {
            app: 'cakephp-mysql-example',
            template: 'cakephp-mysql-example',
            'template.openshift.io/template-instance-owner': '86b6b79a-ddf4-11e9-a662-0a580a820020',
          },
          annotations: { description: 'Exposes the database server' },
        },
        spec: {
          ports: [{ name: 'mysql', protocol: 'TCP', port: 3306, targetPort: 3306 }],
          selector: { name: 'mysql' },
          clusterIP: '172.30.57.252',
          type: 'ClusterIP',
          sessionAffinity: 'None',
        },
        status: { loadBalancer: {} },
      },
      {
        kind: 'service',
        metadata: {
          name: 'perl',
          namespace: 'jeff-project',
          uid: 'b69e4877-ddf9-11e9-b012-0a0700ae5e38',
          resourceVersion: '26842',
          creationTimestamp: '2019-09-23T12:00:19Z',
          labels: {
            app: 'perl',
            'app.kubernetes.io/component': 'perl',
            'app.kubernetes.io/instance': 'perl',
          },
          annotations: { 'openshift.io/generated-by': 'OpenShiftWebConsole' },
        },
        spec: {
          ports: [{ name: '8080-tcp', protocol: 'TCP', port: 8080, targetPort: 8080 }],
          selector: { app: 'perl', deploymentconfig: 'perl' },
          clusterIP: '172.30.7.197',
          type: 'ClusterIP',
          sessionAffinity: 'None',
        },
        status: { loadBalancer: {} },
      },
    ],
  },
  replicaSets: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'ReplicaSet',
        apiVersion: 'apps/v1',
        metadata: {
          annotations: {
            'deployment.kubernetes.io/desired-replicas': '6',
            'deployment.kubernetes.io/max-replicas': '8',
            'deployment.kubernetes.io/revision': '1',
          },
          resourceVersion: '471848',
          name: 'test-deployment-1-54b47fbb75',
          uid: '64b4abd7-debd-11e9-b22b-06b197463f30',
          creationTimestamp: '2019-09-24T11:21:03Z',
          generation: 4,
          namespace: 'jeff-project',
          ownerReferences: [
            {
              apiVersion: 'apps/v1',
              kind: 'Deployment',
              name: 'test-deployment-1',
              uid: '64b34874-debd-11e9-8cdf-0a0700ae5e38',
              controller: true,
              blockOwnerDeletion: true,
            },
          ],
          labels: { app: 'hello-openshift', 'pod-template-hash': '54b47fbb75' },
        },
        spec: {
          replicas: 6,
          selector: { matchLabels: { app: 'hello-openshift', 'pod-template-hash': '54b47fbb75' } },
          template: {
            metadata: {
              creationTimestamp: null,
              labels: { app: 'hello-openshift', 'pod-template-hash': '54b47fbb75' },
            },
            spec: {
              containers: [
                {
                  name: 'hello-openshift',
                  image: 'openshift/hello-openshift',
                  ports: [{ containerPort: 8080, protocol: 'TCP' }],
                  resources: {},
                  terminationMessagePath: '/dev/termination-log',
                  terminationMessagePolicy: 'File',
                  imagePullPolicy: ImagePullPolicy.Always,
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
          replicas: 6,
          fullyLabeledReplicas: 6,
          readyReplicas: 6,
          availableReplicas: 6,
          observedGeneration: 4,
        },
      },
    ],
  },
  buildConfigs: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'buildconfig',
        metadata: {
          name: 'cakephp-mysql-example',
          namespace: 'jeff-project',
          uid: '86da21d7-ddf4-11e9-a662-0a580a820020',
          resourceVersion: '17018',
          creationTimestamp: '2019-09-23T11:23:11Z',
          labels: {
            app: 'cakephp-mysql-example',
            template: 'cakephp-mysql-example',
            'template.openshift.io/template-instance-owner': '86b6b79a-ddf4-11e9-a662-0a580a820020',
          },
          annotations: {
            description: 'Defines how to build the application',
            'template.alpha.openshift.io/wait-for-ready': 'true',
          },
        },
        spec: {
          nodeSelector: null,
          output: { to: { kind: 'ImageStreamTag', name: 'cakephp-mysql-example:latest' } },
          resources: {},
          successfulBuildsHistoryLimit: 5,
          failedBuildsHistoryLimit: 5,
          strategy: {
            type: 'Source',
            sourceStrategy: {
              from: { kind: 'ImageStreamTag', namespace: 'openshift', name: 'php:7.1' },
              env: [{ name: 'COMPOSER_MIRROR' }],
            },
          },
          postCommit: { script: './vendor/bin/phpunit' },
          source: { type: 'Git', git: { uri: 'https://github.com/sclorg/cakephp-ex.git' } },
          triggers: [
            { type: 'ImageChange', imageChange: {} },
            { type: 'ConfigChange' },
            { type: 'GitHub', github: { secret: 'i2FDtC6Ba1FhveTVC8FdnpULyQuIlvxyOwex0n4q' } },
          ],
          runPolicy: 'Serial',
        },
        status: { lastVersion: 0 },
      },
      {
        kind: 'buildconfig',
        metadata: {
          name: 'dotnet-example',
          namespace: 'jeff-project',
          uid: '7f4a56aa-ddf4-11e9-b981-0a580a800015',
          resourceVersion: '16940',
          creationTimestamp: '2019-09-23T11:22:58Z',
          labels: {
            'template.openshift.io/template-instance-owner': '7f25e822-ddf4-11e9-a662-0a580a820020',
          },
          annotations: { description: 'Defines how to build the application' },
        },
        spec: {
          nodeSelector: null,
          output: { to: { kind: 'ImageStreamTag', name: 'dotnet-example:latest' } },
          resources: {},
          successfulBuildsHistoryLimit: 5,
          failedBuildsHistoryLimit: 5,
          strategy: {
            type: 'Source',
            sourceStrategy: {
              from: { kind: 'ImageStreamTag', namespace: 'openshift', name: 'dotnet:2.2' },
              env: [
                { name: 'DOTNET_STARTUP_PROJECT', value: 'app' },
                { name: 'DOTNET_ASSEMBLY_NAME' },
                { name: 'DOTNET_NPM_TOOLS' },
                { name: 'DOTNET_TEST_PROJECTS' },
                { name: 'DOTNET_CONFIGURATION', value: 'Release' },
                { name: 'DOTNET_RESTORE_SOURCES' },
                { name: 'DOTNET_TOOLS' },
              ],
            },
          },
          postCommit: {},
          source: {
            type: 'Git',
            git: {
              uri: 'https://github.com/redhat-developer/s2i-dotnetcore-ex.git',
              ref: 'dotnetcore-2.2',
            },
          },
          triggers: [
            { type: 'ImageChange', imageChange: {} },
            { type: 'ConfigChange' },
            { type: 'GitHub', github: { secret: '23NXE12vg3X1qQSaXR17tLduAFAXUWHhNdSW3QkI' } },
            { type: 'Generic', generic: { secret: '6CYilKtmyOHqKMPgOVh1XUUd2Q8HNxYehFD51Hk5' } },
          ],
          runPolicy: 'Serial',
        },
        status: { lastVersion: 0 },
      },
    ],
  },
  builds: { loaded: true, loadError: '', data: [] },
  statefulSets: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'statefulset',
        metadata: {
          name: 'test-statefulset-1',
          namespace: 'jeff-project',
          uid: '75c049b5-debd-11e9-8cdf-0a0700ae5e38',
          resourceVersion: '471258',
          generation: 1,
          creationTimestamp: '2019-09-24T11:21:31Z',
          labels: { 'app.kubernetes.io/part-of': 'application-3' },
        },
        spec: {
          replicas: 3,
          selector: { matchLabels: { app: 'nginx' } },
          template: {
            metadata: { creationTimestamp: null, labels: { app: 'nginx' } },
            spec: {
              containers: [
                {
                  name: 'nginx',
                  image: 'gcr.io/google_containers/nginx-slim:0.8',
                  ports: [{ name: 'web', containerPort: 80, protocol: 'TCP' }],
                  resources: {},
                  volumeMounts: [{ name: 'www', mountPath: '/usr/share/nginx/html' }],
                  terminationMessagePath: '/dev/termination-log',
                  terminationMessagePolicy: 'File',
                  imagePullPolicy: ImagePullPolicy.IfNotPresent,
                },
              ],
              restartPolicy: 'Always',
              terminationGracePeriodSeconds: 10,
              dnsPolicy: 'ClusterFirst',
              securityContext: {},
              schedulerName: 'default-scheduler',
            },
          },
          volumeClaimTemplates: [
            {
              metadata: { name: 'www', creationTimestamp: null },
              spec: {
                accessModes: ['ReadWriteOnce'],
                resources: { requests: { storage: '1Gi' } },
                storageClassName: 'my-storage-class',
                volumeMode: 'Filesystem',
              },
              status: { phase: 'Pending' },
            },
          ],
          serviceName: 'nginx',
          podManagementPolicy: 'OrderedReady',
          updateStrategy: { type: 'RollingUpdate', rollingUpdate: { partition: 0 } },
          revisionHistoryLimit: 10,
        },
        status: {
          observedGeneration: 1,
          replicas: 1,
          currentReplicas: 1,
          updatedReplicas: 1,
          currentRevision: 'test-statefulset-1-7d57df7bfc',
          updateRevision: 'test-statefulset-1-7d57df7bfc',
          collisionCount: 0,
        },
      },
    ],
  },
};
