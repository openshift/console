import { GitImportFormData, Resources } from '../import-types';
import { healthChecksProbeInitialData } from '../../health-checks/health-checks-probe-utils';

export const mockPipelineTemplate = {
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
    selectedKey: '#UNASSIGNED_KEY#',
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
  serverless: {
    scaling: {
      minpods: 0,
      maxpods: '',
      concurrencytarget: '',
      concurrencylimit: '',
    },
  },
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
    containerPort: 8080,
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
      selfLink: '/apis/image.openshift.io/v1/namespaces/openshift/imagestreams/nodejs',
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
