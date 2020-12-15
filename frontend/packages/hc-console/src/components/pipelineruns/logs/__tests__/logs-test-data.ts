import { PodKind, ContainerSpec } from '@console/internal/module/k8s';

export const podData: PodKind = {
  kind: 'Pod',
  apiVersion: 'v1',
  metadata: {
    name: 'nodejs-ex-git-d0sjao-deploy-jb79p-pod-gxdcp',
    namespace: 'default',
    selfLink: '/api/v1/namespaces/default/pods/nodejs-ex-git-d0sjao-deploy-jb79p-pod-gxdcp',
    uid: '10686a51-74ad-4ec0-8a1d-e618a86b6098',
    resourceVersion: '70112',
    creationTimestamp: '2020-03-30T15:14:13Z',
    labels: {
      'app.kubernetes.io/instance': 'nodejs-ex-git',
      'app.kubernetes.io/managed-by': 'tekton-pipelines',
      'operator.tekton.dev/provider-type': 'redhat',
      'pipeline.openshift.io/runtime': 'nodejs',
      'tekton.dev/pipeline': 'nodejs-ex-git',
      'tekton.dev/pipelineRun': 'nodejs-ex-git-d0sjao',
      'tekton.dev/pipelineTask': 'deploy',
      'tekton.dev/task': 'openshift-client',
      'tekton.dev/taskRun': 'nodejs-ex-git-d0sjao-deploy-jb79p',
    },
    annotations: {
      'k8s.v1.cni.cncf.io/networks-status': '',
      manifestival: 'new',
      'tekton.dev/ready': 'READY',
      'tekton.dev/release': 'devel',
    },
    ownerReferences: [
      {
        apiVersion: 'tekton.dev/v1alpha1',
        kind: 'TaskRun',
        name: 'nodejs-ex-git-d0sjao-deploy-jb79p',
        uid: 'e2a3274a-6481-4a97-affd-bb82cfdc2072',
        controller: true,
        blockOwnerDeletion: true,
      },
    ],
  },
  spec: {
    volumes: [
      {
        name: 'tekton-internal-workspace',
        emptyDir: {},
      },
      {
        name: 'tekton-internal-home',
        emptyDir: {},
      },
      {
        name: 'tekton-internal-secret-volume-pipeline-dockercfg-h6bpf',
        secret: {
          secretName: 'pipeline-dockercfg-h6bpf',
          defaultMode: 420,
        },
      },
      {
        name: 'tekton-internal-tools',
        emptyDir: {},
      },
      {
        name: 'tekton-internal-downward',
        downwardAPI: {
          items: [
            {
              path: 'ready',
              fieldRef: {
                apiVersion: 'v1',
                fieldPath: "metadata.annotations['tekton.dev/ready']",
              },
            },
          ],
          defaultMode: 420,
        },
      },
      {
        name: 'pipeline-token-g2xjb',
        secret: {
          secretName: 'pipeline-token-g2xjb',
          defaultMode: 420,
        },
      },
    ],
    initContainers: [
      {
        name: 'credential-initializer',
        image: 'quay.io/openshift-pipeline/tektoncd-pipeline-creds-init:v0.10.1',
        command: ['/ko-app/creds-init'],
        args: ['-docker-cfg=pipeline-dockercfg-h6bpf'],
        env: [
          {
            name: 'HOME',
            value: '/tekton/home',
          },
        ],
        resources: {},
        volumeMounts: [
          {
            name: 'tekton-internal-workspace',
            mountPath: '/workspace',
          },
          {
            name: 'tekton-internal-home',
            mountPath: '/tekton/home',
          },
          {
            name: 'tekton-internal-secret-volume-pipeline-dockercfg-h6bpf',
            mountPath: '/tekton/creds-secrets/pipeline-dockercfg-h6bpf',
          },
          {
            name: 'pipeline-token-g2xjb',
            readOnly: true,
            mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
          },
        ],
        terminationMessagePath: '/dev/termination-log',
        terminationMessagePolicy: 'File',
      },
      {
        name: 'place-tools',
        image: 'quay.io/openshift-pipeline/tektoncd-pipeline-entrypoint:v0.10.1',
        command: ['cp', '/ko-app/entrypoint', '/tekton/tools/entrypoint'],
        resources: {},
        volumeMounts: [
          {
            name: 'tekton-internal-tools',
            mountPath: '/tekton/tools',
          },
          {
            name: 'pipeline-token-g2xjb',
            readOnly: true,
            mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
          },
        ],
        terminationMessagePath: '/dev/termination-log',
        terminationMessagePolicy: 'File',
      },
    ],
    containers: [
      {
        name: 'step-oc',
        image: 'quay.io/openshift/origin-cli:latest',
        command: ['/tekton/tools/entrypoint'],
        args: [
          '-wait_file',
          '/tekton/downward/ready',
          '-wait_file_content',
          '-post_file',
          '/tekton/tools/0',
          '-termination_path',
          '/tekton/termination',
          '-entrypoint',
          '/usr/bin/oc',
          '--',
          'new-app',
          '--docker-image',
          'sf',
        ],
        workingDir: '/workspace',
        env: [
          {
            name: 'HOME',
            value: '/tekton/home',
          },
        ],
        volumeMounts: [
          {
            name: 'tekton-internal-tools',
            mountPath: '/tekton/tools',
          },
          {
            name: 'tekton-internal-downward',
            mountPath: '/tekton/downward',
          },
          {
            name: 'tekton-internal-workspace',
            mountPath: '/workspace',
          },
          {
            name: 'tekton-internal-home',
            mountPath: '/tekton/home',
          },
          {
            name: 'pipeline-token-g2xjb',
            readOnly: true,
            mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
          },
        ],
        terminationMessagePath: '/tekton/termination',
        terminationMessagePolicy: 'File',
      },
    ],
    restartPolicy: 'Never',
    terminationGracePeriodSeconds: 30,
    dnsPolicy: 'ClusterFirst',
    serviceAccountName: 'pipeline',
    serviceAccount: 'pipeline',
    nodeName: 'ip-10-0-151-70.us-east-2.compute.internal',
    securityContext: {},
    imagePullSecrets: [
      {
        name: 'pipeline-dockercfg-h6bpf',
      },
    ],
    schedulerName: 'default-scheduler',
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
    priority: 0,
    enableServiceLinks: true,
  },
  status: {
    phase: 'Running',
    conditions: [
      {
        type: 'Initialized',
        status: 'True',
        lastProbeTime: null,
        lastTransitionTime: '2020-03-30T15:14:18Z',
      },
      {
        type: 'Ready',
        status: 'False',
        lastProbeTime: null,
        lastTransitionTime: '2020-03-30T15:14:24Z',
        reason: 'ContainersNotReady',
        message: 'containers with unready status: [step-oc]',
      },
      {
        type: 'ContainersReady',
        status: 'False',
        lastProbeTime: null,
        lastTransitionTime: '2020-03-30T15:14:24Z',
        reason: 'ContainersNotReady',
        message: 'containers with unready status: [step-oc]',
      },
      {
        type: 'PodScheduled',
        status: 'True',
        lastProbeTime: null,
        lastTransitionTime: '2020-03-30T15:14:13Z',
      },
    ],
    hostIP: '10.0.151.70',
    podIP: '10.128.2.24',
    podIPs: [
      {
        ip: '10.128.2.24',
      },
    ],
    startTime: '2020-03-30T15:14:13Z',
    initContainerStatuses: [
      {
        name: 'credential-initializer',
        state: {
          terminated: {
            exitCode: 0,
            reason: 'Completed',
            startedAt: '2020-03-30T15:14:16Z',
            finishedAt: '2020-03-30T15:14:16Z',
            containerID: 'cri-o://32c22d040609b6b5d728b9830ff7304760091b1aef8a50bd48e7545b957085f8',
          },
        },
        lastState: {},
        ready: true,
        restartCount: 0,
        image: 'quay.io/openshift-pipeline/tektoncd-pipeline-creds-init:v0.10.1',
        imageID:
          'quay.io/openshift-pipeline/tektoncd-pipeline-creds-init@sha256:851fd079a51d62119cf6f9c21029232146cfdcf571e3123d2fd89ba9d26223fd',
        containerID: 'cri-o://32c22d040609b6b5d728b9830ff7304760091b1aef8a50bd48e7545b957085f8',
      },
      {
        name: 'place-tools',
        state: {
          terminated: {
            exitCode: 0,
            reason: 'Completed',
            startedAt: '2020-03-30T15:14:18Z',
            finishedAt: '2020-03-30T15:14:18Z',
            containerID: 'cri-o://1a547904600598512aa194a06cd3424b326c57b9d6351f9322784c12e9fdbfd1',
          },
        },
        lastState: {},
        ready: true,
        restartCount: 0,
        image: 'quay.io/openshift-pipeline/tektoncd-pipeline-entrypoint:v0.10.1',
        imageID:
          'quay.io/openshift-pipeline/tektoncd-pipeline-entrypoint@sha256:bba0de567eaf4d85109c088e0a52aacb618ef63f945e2ecc995b4ddb3123d5c6',
        containerID: 'cri-o://1a547904600598512aa194a06cd3424b326c57b9d6351f9322784c12e9fdbfd1',
      },
    ],
    containerStatuses: [
      {
        name: 'step-oc',
        state: {
          terminated: {
            exitCode: 1,
            reason: 'Error',
            message:
              '[{"name":"","digest":"","key":"StartedAt","value":"2020-03-30T15:14:22Z","resourceRef":{}}]',
            startedAt: '2020-03-30T15:14:19Z',
            finishedAt: '2020-03-30T15:14:23Z',
            containerID: 'cri-o://3d7a65c8cba98f117e6c805c65739462fa3d92a5cc39e7fcb8acb95f9ddc8a04',
          },
        },
        lastState: {},
        ready: false,
        restartCount: 0,
        image: 'quay.io/openshift/origin-cli:latest',
        imageID:
          'quay.io/openshift/origin-cli@sha256:5228c7612e0c71e63d8d8e5671934fe3117dac798e7d1c1afdf984a69b7fbaa4',
        containerID: 'cri-o://3d7a65c8cba98f117e6c805c65739462fa3d92a5cc39e7fcb8acb95f9ddc8a04',
      },
    ],
    qosClass: 'BestEffort',
  },
};

export const sampleContainer: ContainerSpec = {
  name: 'step-oc',
  image: 'quay.io/openshift/origin-cli:latest',
  command: ['/tekton/tools/entrypoint'],
  args: [
    '-wait_file',
    '/tekton/downward/ready',
    '-wait_file_content',
    '-post_file',
    '/tekton/tools/0',
    '-termination_path',
    '/tekton/termination',
    '-entrypoint',
    '/usr/bin/oc',
    '--',
    'new-app',
    '--docker-image',
    'sf',
  ],
  workingDir: '/workspace',
  env: [
    {
      name: 'HOME',
      value: '/tekton/home',
    },
  ],
  volumeMounts: [
    {
      name: 'tekton-internal-tools',
      mountPath: '/tekton/tools',
    },
    {
      name: 'tekton-internal-downward',
      mountPath: '/tekton/downward',
    },
    {
      name: 'tekton-internal-workspace',
      mountPath: '/workspace',
    },
    {
      name: 'tekton-internal-home',
      mountPath: '/tekton/home',
    },
    {
      name: 'pipeline-token-g2xjb',
      readOnly: true,
      mountPath: '/var/run/secrets/kubernetes.io/serviceaccount',
    },
  ],
  terminationMessagePath: '/tekton/termination',
  terminationMessagePolicy: 'File',
};
