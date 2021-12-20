import { CatalogItem } from '@console/dynamic-plugin-sdk/src';
import { TaskKind } from '../types';
import { TektonHubTask } from '../types/tektonHub';

export enum CatalogItemTypes {
  CLUSTER_TASK = 'clusterTask',
  TEKTONHUB_TASK = 'TektonHubTask',
}

export enum sampleVersions {
  VERSION_01 = '0.1',
  VERSION_02 = '0.2',
}
export enum PlatformTypes {
  LINUX_AMD64 = 'linux/amd64',
  LINUX_PPC64LE = 'linux/ppc64le',
  LINUX_S390X = 'linux/s390x',
  LINUX_ARM64 = 'linux/arm64',
}

type SampleTasks = { [key in CatalogItemTypes]?: TaskKind | TektonHubTask };
type TektonHubPlatformTasks = { [key in PlatformTypes]?: TaskKind | TektonHubTask };

export const sampleTasks: SampleTasks = {
  [CatalogItemTypes.CLUSTER_TASK]: {
    kind: 'Task',
    apiVersion: 'tekton.dev/v1beta1',
    metadata: {
      annotations: {
        'tekton.dev/categories': 'CLI',
        'tekton.dev/displayName': 'ansible tower cli',
        'tekton.dev/pipelines.minVersion': '0.12.1',
        'tekton.dev/tags': 'ansible, cli',
      },
      resourceVersion: '425457',
      name: 'ansible-tower-cli',
      uid: '8a357c10-ea59-49a3-b4ea-26fd594afb10',
      creationTimestamp: '2021-08-12T07:02:14Z',
      generation: 1,
      namespace: 'karthik',
      labels: {
        'app.kubernetes.io/version': '0.1',
      },
    },
    spec: {
      description:
        'Ansible-tower-cli task simplifies starting jobs, workflow jobs, manage users, projects etc.\nAnsible Tower (formerly ‘AWX’) is a web-based solution that makes Ansible even more easy to use for IT teams of all kinds, It provides the tower-cli(Tower-CLI) command line tool that simplifies the tasks of starting jobs, workflow jobs, manage users, projects etc.',
      params: [
        {
          default: 'false',
          description: 'Disable tower ssl verification',
          name: 'SSLVERIFY',
          type: 'string',
        },
        {
          default: ['--help'],
          description: 'The tower-cli commands to tun',
          name: 'ARGS',
          type: 'array',
        },
        {
          default: '',
          description: 'The Ansible Tower host',
          name: 'HOST',
          type: 'string',
        },
        {
          default: 'tower-creds',
          description: 'The Ansible Tower secret with credentials',
          name: 'tower-secret',
          type: 'string',
        },
      ],
      steps: [
        {
          args: [
            'echo -e "verify_ssl = $(params.SSLVERIFY)\\nverbose = true\\nhost = $(params.HOST)\\nusername = $USER\\npassword = $PASS" > ~/.tower_cli.cfg\nchmod 600 ~/.tower_cli.cfg\necho "Generated tower_cli.cfg file"\necho "-----------------------------"\nls -lah ~/ | grep tower_cli\necho "-----------------------------"',
          ],
          command: ['/bin/sh', '-c'],
          env: [],
          image:
            'quay.io/rcmendes/ansible-tower-cli@sha256:3a61778f410526db8d6e02e87715d58ee770c4a4faf57ac408cb5ec1a025ef2c',
          name: 'config',
          resources: {},
        },
        {
          args: ['$(params.ARGS)'],
          command: ['/usr/bin/tower-cli'],
          image:
            'quay.io/rcmendes/ansible-tower-cli@sha256:3a61778f410526db8d6e02e87715d58ee770c4a4faf57ac408cb5ec1a025ef2c',
          name: 'tower-cli',
          resources: {},
        },
      ],
    },
  },
  [CatalogItemTypes.TEKTONHUB_TASK]: {
    id: 1,
    name: 'ansible-runner',
    catalog: {
      id: 1,
      name: 'tekton',
      type: 'community',
    },
    categories: [
      {
        id: 11,
        name: 'CLI',
      },
    ],
    kind: 'Task',
    latestVersion: {
      id: 1,
      version: '0.1',
      displayName: 'Ansible Runner',
      description: 'Task to run Ansible playbooks using Ansible Runner',
      minPipelinesVersion: '0.12.1',
      hubURL: 'tekton/task/curl/0.1',
      rawURL:
        'https://raw.githubusercontent.com/tektoncd/catalog/main/task/ansible-runner/0.1/ansible-runner.yaml',
      webURL:
        'https://github.com/tektoncd/catalog/tree/main/task/ansible-runner/0.1/ansible-runner.yaml',
      updatedAt: '2021-07-26T12:15:08Z',
      platforms: [
        {
          id: 1,
          name: 'linux/amd64',
        },
      ],
    },
    tags: [
      {
        id: 78,
        name: 'cli',
      },
    ],
    platforms: [
      {
        id: 1,
        name: 'linux/amd64',
      },
    ],
    rating: 4.2,
  },
};

export const tekonHubPlatformTasks: TektonHubPlatformTasks = {
  [PlatformTypes.LINUX_AMD64]: {
    ...sampleTasks[CatalogItemTypes.TEKTONHUB_TASK],
    platforms: [{ id: 1, name: PlatformTypes.LINUX_AMD64 }],
  },
  [PlatformTypes.LINUX_PPC64LE]: {
    ...sampleTasks[CatalogItemTypes.TEKTONHUB_TASK],
    platforms: [
      { id: 1, name: PlatformTypes.LINUX_AMD64 },
      { id: 2, name: PlatformTypes.LINUX_PPC64LE },
    ],
  },
  [PlatformTypes.LINUX_S390X]: {
    ...sampleTasks[CatalogItemTypes.TEKTONHUB_TASK],
    platforms: [{ id: 3, name: PlatformTypes.LINUX_S390X }],
  },
  [PlatformTypes.LINUX_ARM64]: {
    ...sampleTasks[CatalogItemTypes.TEKTONHUB_TASK],
    platforms: [{ id: 4, name: PlatformTypes.LINUX_ARM64 }],
  },
};

export const sampleClusterTaskCatalogItem: CatalogItem = {
  uid: '8a357c10-ea59-49a3-b4ea-26fd594afb10',
  type: 'Red Hat',
  name: 'ansible-tower-cli',
  description:
    'Ansible-tower-cli task simplifies starting jobs, workflow jobs, manage users, projects etc.\nAnsible Tower (formerly ‘AWX’) is a web-based solution that makes Ansible even more easy to use for IT teams of all kinds, It provides the tower-cli(Tower-CLI) command line tool that simplifies the tasks of starting jobs, workflow jobs, manage users, projects etc.',
  provider: 'Red Hat',
  tags: ['ansible', 'cli'],
  creationTimestamp: '2021-08-12T07:02:14Z',
  icon: {},
  attributes: {
    installed: '0.1',
    versions: [
      {
        id: '0.1',
        version: '0.1',
      },
    ],
    categories: ['CLI'],
  },
  cta: {
    label: 'Add',
  },
  data: sampleTasks[CatalogItemTypes.CLUSTER_TASK],
};

export const sampleTektonHubCatalogItem: CatalogItem = {
  uid: '1',
  type: 'Community',
  name: 'ansible-runner',
  description: 'Task to run Ansible playbooks using Ansible Runner',
  provider: 'Community',
  tags: ['cli'],
  icon: {
    class: 'build',
  },
  attributes: {
    installed: '',
    versions: [
      {
        id: 1,
        version: '0.1',
        rawURL:
          'https://raw.githubusercontent.com/tektoncd/catalog/main/task/ansible-runner/0.1/ansible-runner.yaml',
        webURL:
          'https://github.com/tektoncd/catalog/tree/main/task/ansible-runner/0.1/ansible-runner.yaml',
        platforms: [
          {
            id: 1,
            name: 'linux/amd64',
          },
        ],
      },
      {
        id: 2,
        version: '0.2',
        rawURL:
          'https://raw.githubusercontent.com/tektoncd/catalog/main/task/ansible-runner/0.2/ansible-runner.yaml',
        webURL:
          'https://github.com/tektoncd/catalog/tree/main/task/ansible-runner/0.2/ansible-runner.yaml',
        platforms: [
          {
            id: 1,
            name: 'linux/amd64',
          },
        ],
      },
    ],
    categories: ['CLI'],
  },
  cta: {
    label: 'Add',
  },
  data: sampleTasks[CatalogItemTypes.TEKTONHUB_TASK],
};

export const sampleTektonHubCatalogItemWithHubURL: CatalogItem = {
  uid: '1',
  type: 'Community',
  name: 'ansible-runner',

  attributes: {
    installed: '',
    versions: [
      { id: '1', hubURL: 'foo/bar/test' },
      { id: '2', hubURL: 'foo/bar/test2' },
      { id: '3', hubURL: 'foo/bar/test3' },
    ],
  },
  data: {
    id: 1,
    name: 'ansible-runner',
    kind: 'Task',
    latestVersion: {
      id: 1,
      version: '0.1',
      displayName: 'Ansible Runner',
      description: 'Task to run Ansible playbooks using Ansible Runner',
      minPipelinesVersion: '0.12.1',
      rawURL:
        'https://raw.githubusercontent.com/tektoncd/catalog/main/task/ansible-runner/0.1/ansible-runner.yaml',
      webURL:
        'https://github.com/tektoncd/catalog/tree/main/task/ansible-runner/0.1/ansible-runner.yaml',
      updatedAt: '2021-07-26T12:15:08Z',
      platforms: [
        {
          id: 1,
          name: 'linux/amd64',
        },
      ],
    },
  },
};

export const sampleTaskWithMultipleVersions = {
  [sampleVersions.VERSION_01]: `---
  apiVersion: tekton.dev/v1beta1
  kind: Task
  metadata:
    name: openshift-client
    labels:
      app.kubernetes.io/version: "0.1"
    annotations:
      tekton.dev/categories: Openshift
      tekton.dev/pipelines.minVersion: "0.12.1"
      tekton.dev/tags: cli
      tekton.dev/displayName: "openshift client"
      tekton.dev/platforms: "linux/amd64"
  spec:
    description: >-
      This task runs commands against the cluster where the task run is
      being executed.
  
      OpenShift is a Kubernetes distribution from Red Hat which provides oc,
      the OpenShift CLI that complements kubectl for simplifying deployment
      and configuration applications on OpenShift.
  
    params:
    - name: SCRIPT
      description: The OpenShift CLI arguments to run
      type: string
      default: "oc $@"
    - name: ARGS
      description: The OpenShift CLI arguments to run
      type: array
      default:
      - "help"
    - name: VERSION
      description: The OpenShift Version to use
      type: string
      default: "4.6"
    resources:
      inputs:
        - name: source
          type: git
          optional: true
    steps:
      - name: oc
        image: quay.io/openshift/origin-cli:$(params.VERSION)
        script: "$(params.SCRIPT)"
        args:
          - "$(params.ARGS)"`,
  [sampleVersions.VERSION_02]: `---
          apiVersion: tekton.dev/v1beta1
          kind: Task
          metadata:
            name: openshift-client
            labels:
              app.kubernetes.io/version: "0.2"
            annotations:
              tekton.dev/categories: Openshift
              tekton.dev/pipelines.minVersion: "0.17.0"
              tekton.dev/tags: cli
              tekton.dev/displayName: "openshift client"
              tekton.dev/platforms: "linux/amd64"
          spec:
            workspaces:
              - name: manifest-dir
                optional: true
                description: >-
                  The workspace which contains kubernetes manifests which we want to apply on the cluster.
              - name: kubeconfig-dir
                optional: true
                description: >-
                  The workspace which contains the the kubeconfig file if in case we want to run the oc command on another cluster.
            description: >-
              This task runs commands against the cluster provided by user
              and if not provided then where the Task is being executed.
          
              OpenShift is a Kubernetes distribution from Red Hat which provides oc,
              the OpenShift CLI that complements kubectl for simplifying deployment
              and configuration applications on OpenShift.
          
            params:
              - name: SCRIPT
                description: The OpenShift CLI arguments to run
                type: string
                default: "oc help"
              - name: VERSION
                description: The OpenShift Version to use
                type: string
                default: "4.7"
            steps:
              - name: oc
                image: quay.io/openshift/origin-cli:$(params.VERSION)
                script: |
                  #!/usr/bin/env bash
          
                  [[ "$(workspaces.manifest-dir.bound)" == "true" ]] && \
                  cd $(workspaces.manifest-dir.path)
          
                  [[ "$(workspaces.kubeconfig-dir.bound)" == "true" ]] && \
                  [[ -f $(workspaces.kubeconfig-dir.path)/kubeconfig ]] && \
                  export KUBECONFIG=$(workspaces.kubeconfig-dir.path)/kubeconfig
          
                  $(params.SCRIPT)`,
};

export const sampleCatalogItems: CatalogItem[] = [
  sampleClusterTaskCatalogItem,
  sampleTektonHubCatalogItem,
];
