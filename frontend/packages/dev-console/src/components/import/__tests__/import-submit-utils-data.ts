import { PipelineKind } from '@console/pipelines-plugin/src/types';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { healthChecksProbeInitialData } from '../../health-checks/health-checks-probe-utils';
import { serverlessInitialValues } from '../__mocks__/serverless-mock';
import { GitImportFormData, Resources } from '../import-types';

export const mockPipelineTemplate: PipelineKind = {
  apiVersion: 'tekton.dev/v1alpha1',
  kind: 'Pipeline',
  metadata: {
    name: 'new-pipeline',
    namespace: 'new-proj',
  },
  spec: {
    params: [
      {
        name: 'paramName',
        type: 'string',
      },
    ],
    resources: [
      {
        name: 'app-git',
        type: 'git',
      },
      {
        name: 'app-image',
        type: 'image',
      },
    ],
    tasks: [
      {
        name: 'build-app',
        taskRef: {
          name: 's2i-java-11',
          kind: 'ClusterTask',
        },
        resources: {
          inputs: [
            {
              name: 'source',
              resource: 'app-git',
            },
          ],
          outputs: [
            {
              name: 'image',
              resource: 'app-image',
            },
          ],
        },
      },
    ],
  },
};

export const defaultData: GitImportFormData = {
  project: {
    name: 'gijohn',
    displayName: '',
    description: '',
  },
  application: {
    initial: '',
    name: '',
    selectedKey: UNASSIGNED_KEY,
  },
  name: 'nodejs-ex-git',
  image: {
    tag: '10-SCL',
    ports: [
      {
        containerPort: 8080,
        protocol: 'TCP',
      },
    ],
    selected: 'nodejs',
    recommended: 'nodejs',
    tagObj: {
      name: '10-SCL',
      annotations: {
        description:
          'Build and run Node.js 10 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/nodeshift/centos7-s2i-nodejs.',
        iconClass: 'icon-nodejs',
        'openshift.io/display-name': 'Node.js 10',
        'openshift.io/provider-display-name': 'Red Hat, Inc.',
        sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
        tags: 'builder,nodejs',
        version: '10',
      },
      from: {
        kind: 'DockerImage',
        name: 'registry.redhat.io/rhscl/nodejs-10-rhel7',
      },
      generation: 2,
      importPolicy: {},
      referencePolicy: {
        type: 'Local',
      },
    },
    isRecommending: false,
    couldNotRecommend: false,
  },
  serverless: serverlessInitialValues,
  route: {
    create: true,
    targetPort: '',
    path: '',
    hostname: '',
    secure: false,
    tls: {
      termination: '',
      insecureEdgeTerminationPolicy: '',
      caCertificate: '',
      certificate: '',
      destinationCACertificate: '',
      privateKey: '',
    },
  },
  resources: Resources.OpenShift,
  build: {
    env: [],
    triggers: {
      webhook: true,
      image: true,
      config: true,
    },
    strategy: 'Source',
  },
  deployment: {
    env: [],
    triggers: {
      image: true,
      config: true,
    },
    replicas: 1,
  },
  labels: {},
  limits: {
    cpu: {
      request: '',
      requestUnit: 'm',
      defaultRequestUnit: 'm',
      limit: '',
      limitUnit: 'm',
      defaultLimitUnit: 'm',
    },
    memory: {
      request: '',
      requestUnit: 'Mi',
      defaultRequestUnit: 'Mi',
      limit: '',
      limitUnit: 'Mi',
      defaultLimitUnit: 'Mi',
    },
  },
  git: {
    url: 'https://github.com/sclorg/nodejs-ex.git',
    type: 'github',
    ref: '',
    dir: '/',
    showGitType: false,
    secret: '',
    isUrlValidating: false,
  },
  docker: {
    dockerfilePath: 'Dockerfile',
  },
  pipeline: {
    enabled: false,
    template: mockPipelineTemplate,
  },
  healthChecks: healthChecksProbeInitialData,
};

export const nodeJsBuilderImage = {
  name: 'nodejs',
  obj: {
    metadata: {
      annotations: {
        'openshift.io/display-name': 'Node.js',
        'openshift.io/image.dockerRepositoryCheck': '2019-11-05T16:52:18Z',
        'samples.operator.openshift.io/version': '4.3.0-0.ci-2019-11-05-141931',
      },
      resourceVersion: '13443',
      name: 'nodejs',
      uid: 'a244e124-4a42-4248-bbcf-868b39791164',
      creationTimestamp: '2019-11-05T16:50:54Z',
      generation: 2,
      namespace: 'openshift',
      labels: {
        'samples.operator.openshift.io/managed': 'true',
      },
    },
    spec: {
      lookupPolicy: {
        local: false,
      },
      tags: [
        {
          name: '10',
          annotations: {
            description:
              'Build and run Node.js 10 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/nodeshift/centos7-s2i-nodejs.',
            iconClass: 'icon-nodejs',
            'openshift.io/display-name': 'OpenShift Application Runtimes Node.js 10',
            'openshift.io/provider-display-name': 'Red Hat, Inc.',
            sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
            tags: 'builder,nodejs,hidden',
            version: '10',
          },
          from: {
            kind: 'DockerImage',
            name: 'registry.redhat.io/rhoar-nodejs/nodejs-10',
          },
          generation: 2,
          importPolicy: {},
          referencePolicy: {
            type: 'Local',
          },
        },
        {
          name: '10-SCL',
          annotations: {
            description:
              'Build and run Node.js 10 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/nodeshift/centos7-s2i-nodejs.',
            iconClass: 'icon-nodejs',
            'openshift.io/display-name': 'Node.js 10',
            'openshift.io/provider-display-name': 'Red Hat, Inc.',
            sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
            tags: 'builder,nodejs',
            version: '10',
          },
          from: {
            kind: 'DockerImage',
            name: 'registry.redhat.io/rhscl/nodejs-10-rhel7',
          },
          generation: 2,
          importPolicy: {},
          referencePolicy: {
            type: 'Local',
          },
        },
        {
          name: '8',
          annotations: {
            description:
              'Build and run Node.js 8 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-nodejs-container.',
            iconClass: 'icon-nodejs',
            'openshift.io/display-name': 'Node.js 8',
            'openshift.io/provider-display-name': 'Red Hat, Inc.',
            sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
            tags: 'builder,nodejs',
            version: '8',
          },
          from: {
            kind: 'DockerImage',
            name: 'registry.redhat.io/rhscl/nodejs-8-rhel7:latest',
          },
          generation: 2,
          importPolicy: {},
          referencePolicy: {
            type: 'Local',
          },
        },
        {
          name: '8-RHOAR',
          annotations: {
            description:
              'Build and run Node.js 8 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/nodeshift/centos7-s2i-nodejs.',
            iconClass: 'icon-nodejs',
            'openshift.io/display-name': 'OpenShift Application Runtimes Node.js 8',
            'openshift.io/provider-display-name': 'Red Hat, Inc.',
            sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
            tags: 'builder,nodejs',
            version: '8',
          },
          from: {
            kind: 'DockerImage',
            name: 'registry.redhat.io/rhoar-nodejs/nodejs-8',
          },
          generation: 2,
          importPolicy: {},
          referencePolicy: {
            type: 'Local',
          },
        },
        {
          name: 'latest',
          annotations: {
            description:
              'Build and run Node.js 10 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/nodeshift/centos7-s2i-nodejs.\n\nWARNING: By selecting this tag, your application will automatically update to use the latest version of Node.js available on OpenShift, including major versions updates.',
            iconClass: 'icon-nodejs',
            'openshift.io/display-name': 'Node.js (Latest)',
            'openshift.io/provider-display-name': 'Red Hat, Inc.',
            sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
            supports: 'nodejs',
            tags: 'builder,nodejs',
          },
          from: {
            kind: 'ImageStreamTag',
            name: '10-SCL',
          },
          generation: 1,
          importPolicy: {},
          referencePolicy: {
            type: 'Local',
          },
        },
      ],
    },
    status: {
      dockerImageRepository: 'image-registry.openshift-image-registry.svc:5000/openshift/nodejs',
      tags: [
        {
          tag: '10',
          items: [
            {
              created: '2019-11-05T16:52:18Z',
              dockerImageReference:
                'registry.redhat.io/rhoar-nodejs/nodejs-10@sha256:74a3ef2964efc03dfc239da3f09691b720ce54ff4bb47588864adb222133f0fc',
              image: 'sha256:74a3ef2964efc03dfc239da3f09691b720ce54ff4bb47588864adb222133f0fc',
              generation: 2,
            },
          ],
        },
        {
          tag: '10-SCL',
          items: [
            {
              created: '2019-11-05T16:52:18Z',
              dockerImageReference:
                'registry.redhat.io/rhscl/nodejs-10-rhel7@sha256:ac2d05221d5492a84626a4002c3d2e9db64cbc67c2b6f91f0c0466f9899e525c',
              image: 'sha256:ac2d05221d5492a84626a4002c3d2e9db64cbc67c2b6f91f0c0466f9899e525c',
              generation: 2,
            },
          ],
        },
        {
          tag: '8',
          items: [
            {
              created: '2019-11-05T16:52:18Z',
              dockerImageReference:
                'registry.redhat.io/rhscl/nodejs-8-rhel7@sha256:52b6114a36532a46867e56355324436063ba89987ca6b91634c0fd4a5cb24822',
              image: 'sha256:52b6114a36532a46867e56355324436063ba89987ca6b91634c0fd4a5cb24822',
              generation: 2,
            },
          ],
        },
        {
          tag: '8-RHOAR',
          items: [
            {
              created: '2019-11-05T16:52:18Z',
              dockerImageReference:
                'registry.redhat.io/rhoar-nodejs/nodejs-8@sha256:7f4b9099ea7e1ba5b2be98304c2d0c2eb1d738d8ceee9d9a1464e71a08d78dd4',
              image: 'sha256:7f4b9099ea7e1ba5b2be98304c2d0c2eb1d738d8ceee9d9a1464e71a08d78dd4',
              generation: 2,
            },
          ],
        },
        {
          tag: 'latest',
          items: [
            {
              created: '2019-11-05T16:52:18Z',
              dockerImageReference:
                'registry.redhat.io/rhscl/nodejs-10-rhel7@sha256:ac2d05221d5492a84626a4002c3d2e9db64cbc67c2b6f91f0c0466f9899e525c',
              image: 'sha256:ac2d05221d5492a84626a4002c3d2e9db64cbc67c2b6f91f0c0466f9899e525c',
              generation: 2,
            },
          ],
        },
      ],
    },
  },
  displayName: 'Node.js',
  title: 'Node.js',
  iconUrl: 'static/assets/nodejs.svg',
  tags: [
    {
      name: '10-SCL',
      annotations: {
        description:
          'Build and run Node.js 10 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/nodeshift/centos7-s2i-nodejs.',
        iconClass: 'icon-nodejs',
        'openshift.io/display-name': 'Node.js 10',
        'openshift.io/provider-display-name': 'Red Hat, Inc.',
        sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
        tags: 'builder,nodejs',
        version: '10',
      },
      from: {
        kind: 'DockerImage',
        name: 'registry.redhat.io/rhscl/nodejs-10-rhel7',
      },
      generation: 2,
      importPolicy: {},
      referencePolicy: {
        type: 'Local',
      },
    },
    {
      name: '8',
      annotations: {
        description:
          'Build and run Node.js 8 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/sclorg/s2i-nodejs-container.',
        iconClass: 'icon-nodejs',
        'openshift.io/display-name': 'Node.js 8',
        'openshift.io/provider-display-name': 'Red Hat, Inc.',
        sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
        tags: 'builder,nodejs',
        version: '8',
      },
      from: {
        kind: 'DockerImage',
        name: 'registry.redhat.io/rhscl/nodejs-8-rhel7:latest',
      },
      generation: 2,
      importPolicy: {},
      referencePolicy: {
        type: 'Local',
      },
    },
    {
      name: '8-RHOAR',
      annotations: {
        description:
          'Build and run Node.js 8 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/nodeshift/centos7-s2i-nodejs.',
        iconClass: 'icon-nodejs',
        'openshift.io/display-name': 'OpenShift Application Runtimes Node.js 8',
        'openshift.io/provider-display-name': 'Red Hat, Inc.',
        sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
        tags: 'builder,nodejs',
        version: '8',
      },
      from: {
        kind: 'DockerImage',
        name: 'registry.redhat.io/rhoar-nodejs/nodejs-8',
      },
      generation: 2,
      importPolicy: {},
      referencePolicy: {
        type: 'Local',
      },
    },
    {
      name: 'latest',
      annotations: {
        description:
          'Build and run Node.js 10 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/nodeshift/centos7-s2i-nodejs.\n\nWARNING: By selecting this tag, your application will automatically update to use the latest version of Node.js available on OpenShift, including major versions updates.',
        iconClass: 'icon-nodejs',
        'openshift.io/display-name': 'Node.js (Latest)',
        'openshift.io/provider-display-name': 'Red Hat, Inc.',
        sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
        supports: 'nodejs',
        tags: 'builder,nodejs',
      },
      from: {
        kind: 'ImageStreamTag',
        name: '10-SCL',
      },
      generation: 1,
      importPolicy: {},
      referencePolicy: {
        type: 'Local',
      },
    },
  ],
  recentTag: {
    name: '10-SCL',
    annotations: {
      description:
        'Build and run Node.js 10 applications on RHEL 7. For more information about using this builder image, including OpenShift considerations, see https://github.com/nodeshift/centos7-s2i-nodejs.',
      iconClass: 'icon-nodejs',
      'openshift.io/display-name': 'Node.js 10',
      'openshift.io/provider-display-name': 'Red Hat, Inc.',
      sampleRepo: 'https://github.com/sclorg/nodejs-ex.git',
      tags: 'builder,nodejs',
      version: '10',
    },
    from: {
      kind: 'DockerImage',
      name: 'registry.redhat.io/rhscl/nodejs-10-rhel7',
    },
    generation: 2,
    importPolicy: {},
    referencePolicy: {
      type: 'Local',
    },
  },
  imageStreamNamespace: 'openshift',
};

export const defaultDevfileFormData: GitImportFormData = {
  name: '',
  project: {
    name: 'gijohn',
    displayName: '',
    description: '',
  },
  application: {
    initial: '',
    name: '',
    selectedKey: '',
    isInContext: false,
  },
  image: {
    selected: '',
    recommended: '',
    tag: '',
    tagObj: {},
    ports: [],
    isRecommending: false,
    couldNotRecommend: false,
  },
  serverless: {
    scaling: {
      minpods: '',
      maxpods: '',
      concurrencytarget: 100,
      concurrencylimit: '',
      autoscale: {
        autoscalewindow: 60,
        autoscalewindowUnit: 's',
        defaultAutoscalewindowUnit: 's',
      },
      concurrencyutilization: 70,
    },
  },
  route: {
    disable: false,
    create: true,
    targetPort: '',
    unknownTargetPort: '',
    defaultUnknownPort: 8080,
    path: '',
    hostname: '',
    secure: false,
    tls: {
      termination: '',
      insecureEdgeTerminationPolicy: '',
      caCertificate: '',
      certificate: '',
      destinationCACertificate: '',
      privateKey: '',
    },
  },
  resources: Resources.Kubernetes,
  build: {
    env: [],
    triggers: {
      webhook: true,
      image: true,
      config: true,
    },
    strategy: 'Devfile',
  },
  deployment: {
    env: [],
    triggers: {
      image: true,
      config: true,
    },
    replicas: 1,
  },
  labels: {},
  limits: {
    cpu: {
      request: '',
      requestUnit: 'm',
      defaultRequestUnit: 'm',
      limit: '',
      limitUnit: 'm',
      defaultLimitUnit: 'm',
    },
    memory: {
      request: '',
      requestUnit: 'Mi',
      defaultRequestUnit: 'Mi',
      limit: '',
      limitUnit: 'Mi',
      defaultLimitUnit: 'Mi',
    },
  },
  healthChecks: {
    readinessProbe: {
      showForm: false,
      enabled: false,
      modified: false,
      data: {
        failureThreshold: '3',
        requestType: 'httpGet',
        httpGet: {
          scheme: undefined,
          path: '/',
          port: '8080',
          httpHeaders: [],
        },
        tcpSocket: {
          port: '8080',
        },
        exec: {
          command: [''],
        },
        initialDelaySeconds: '0',
        periodSeconds: '10',
        timeoutSeconds: '1',
        successThreshold: '1',
      },
    },
    livenessProbe: {
      showForm: false,
      enabled: false,
      modified: false,
      data: {
        failureThreshold: '3',
        requestType: 'httpGet',
        httpGet: {
          scheme: undefined,
          path: '/',
          port: '8080',
          httpHeaders: [],
        },
        tcpSocket: {
          port: '8080',
        },
        exec: {
          command: [''],
        },
        initialDelaySeconds: '0',
        periodSeconds: '10',
        timeoutSeconds: '1',
        successThreshold: '1',
      },
    },
    startupProbe: {
      showForm: false,
      enabled: false,
      modified: false,
      data: {
        failureThreshold: '3',
        requestType: 'httpGet',
        httpGet: {
          scheme: undefined,
          path: '/',
          port: '8080',
          httpHeaders: [],
        },
        tcpSocket: {
          port: '8080',
        },
        exec: {
          command: [''],
        },
        initialDelaySeconds: '0',
        periodSeconds: '10',
        timeoutSeconds: '1',
        successThreshold: '1',
      },
    },
  },
  resourceTypesNotValid: [],
  pipeline: {
    enabled: false,
  },
  git: {
    url: '',
    type: '',
    ref: '',
    dir: '',
    showGitType: false,
    secret: '',
    isUrlValidating: false,
  },
  docker: {
    dockerfilePath: './Dockerfile',
  },
  devfile: {
    devfileHasError: false,
    devfilePath: './devfile.yaml',
  },
};

export const sampleDevfileFormData: GitImportFormData = {
  ...defaultDevfileFormData,
  name: 'devfile-sample',
  application: {
    initial: '',
    name: 'devfile-sample-app',
    selectedKey: 'devfile-sample-app',
  },
  git: {
    url: 'https://github.com/redhat-developer/devfile-sample',
    type: 'github',
    ref: 'master',
    dir: './',
    showGitType: false,
    secret: '',
    isUrlValidating: false,
  },
  image: {
    ...defaultDevfileFormData.image,
    ports: [
      {
        protocol: 'TCP',
        name: 'http-3001',
        containerPort: 3001,
      },
    ],
  },
  deployment: {
    ...defaultDevfileFormData.deployment,
    env: [
      {
        name: 'PROJECTS_ROOT',
        value: '/projects',
      },
      {
        name: 'PROJECT_SOURCE',
        value: '/projects',
      },
    ],
  },
  limits: {
    cpu: {
      request: '',
      requestUnit: '',
      defaultRequestUnit: '',
      limit: '',
      limitUnit: '',
      defaultLimitUnit: '',
    },
    memory: {
      request: '',
      requestUnit: 'Mi',
      defaultRequestUnit: 'Mi',
      limit: '1',
      limitUnit: 'Gi',
      defaultLimitUnit: 'Gi',
    },
  },
  devfile: {
    devfileHasError: false,
    devfilePath: './devfile.yaml',
    devfileContent: 'SKIPPED',
    devfileSuggestedResources: {
      imageStream: {
        kind: 'ImageStream',
        apiVersion: 'image.openshift.io/v1',
        metadata: {
          creationTimestamp: null,
        },
        spec: {
          lookupPolicy: {
            local: false,
          },
        },
        status: {
          dockerImageRepository: '',
        },
      },
      buildResource: {
        kind: 'BuildConfig',
        apiVersion: 'build.openshift.io/v1',
        metadata: {
          creationTimestamp: null,
        },
        spec: {
          source: {
            type: 'Git',
            git: {
              uri: 'https://github.com/redhat-developer/devfile-sample',
              ref: 'master',
            },
            contextDir: 'src',
          },
          strategy: {
            type: 'Docker',
            dockerStrategy: {
              dockerfilePath: 'Dockerfile',
            },
          },
          output: {
            to: {
              kind: 'ImageStreamTag',
              name: 'devfile-sample:latest:latest',
            },
          },
          resources: {},
          postCommit: {},
          nodeSelector: null,
        },
        status: {
          lastVersion: 0,
        },
      },
      deployResource: {
        kind: 'Deployment',
        apiVersion: 'apps/v1',
        metadata: {
          creationTimestamp: null,
        },
        spec: {
          selector: {
            matchLabels: {
              app: 'devfile-sample',
            },
          },
          template: {
            metadata: {
              creationTimestamp: null,
            },
            spec: {},
          },
          strategy: {
            type: 'Recreate',
          },
        },
        status: {},
      },
      service: {
        kind: 'Service',
        apiVersion: 'v1',
        metadata: {
          creationTimestamp: null,
        },
        spec: {
          ports: [
            {
              name: 'port-3001',
              port: 3001,
              targetPort: 3001,
            },
          ],
        },
        status: {
          loadBalancer: {},
        },
      },
      route: {
        kind: 'Route',
        apiVersion: 'route.openshift.io/v1',
        metadata: {
          creationTimestamp: null,
        },
        spec: {
          path: '/',
          to: {
            kind: 'Service',
            name: 'devfile-sample',
            weight: null,
          },
          port: {
            targetPort: 3001,
          },
        },
        status: {},
      },
    },
  },
};
