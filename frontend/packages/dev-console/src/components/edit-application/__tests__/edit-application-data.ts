import { K8sResourceKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/knative-plugin';
import { UNASSIGNED_KEY } from '../../../const';
import { DeployImageFormData, GitImportFormData, Resources } from '../../import/import-types';
import { AppResources } from '../edit-application-types';
import { healthChecksProbeInitialData } from '../../health-checks/health-checks-probe-utils';
import { healthChecksData } from '../../health-checks/__tests__/create-health-checks-probe-data';

export const knativeService: K8sResourceKind = {
  apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
  kind: `${ServiceModel.kind}`,
  metadata: {
    name: 'sample',
    namespace: 'div',
  },
  spec: {
    template: {
      spec: {
        containers: [
          {
            image: 'openshift/hello-openshift',
          },
        ],
      },
    },
  },
};

export const appResources: AppResources = {
  editAppResource: {
    loaded: true,
    loadError: '',
    data: {
      kind: 'DeploymentConfig',
      apiVersion: 'apps.openshift.io/v1',
      metadata: {
        annotations: {
          'app.openshift.io/vcs-ref': 'master',
          'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
        },
        selfLink: '/apis/apps.openshift.io/v1/namespaces/div/deploymentconfigs/nationalparks-py',
        resourceVersion: '329826',
        name: 'nationalparks-py',
        uid: 'c3f2b32d-d5fd-4050-9735-0c95828af6fd',
        creationTimestamp: '2020-01-13T10:33:05Z',
        generation: 16,
        namespace: 'div',
        labels: {
          app: 'nationalparks-py',
          'app.kubernetes.io/component': 'nationalparks-py',
          'app.kubernetes.io/instance': 'nationalparks-py',
          'app.kubernetes.io/name': 'python',
          'app.openshift.io/runtime': 'python',
          'app.openshift.io/runtime-version': '3.6',
          'app.openshift.io/runtime-namespace': 'div',
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
              containerNames: ['nationalparks-py'],
              from: {
                kind: 'ImageStreamTag',
                namespace: 'div',
                name: 'nationalparks-py:latest',
              },
              lastTriggeredImage:
                'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:7d67c08b5b993d72533f9bb07b6429c5a2263de8b67cc1b0ae09d4c0b0d39f97',
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
          app: 'nationalparks-py',
          deploymentconfig: 'nationalparks-py',
        },
        template: {
          metadata: {
            creationTimestamp: null,
            labels: {
              app: 'nationalparks-py',
              deploymentconfig: 'nationalparks-py',
            },
          },
          spec: {
            containers: [
              {
                name: 'nationalparks-py',
                image:
                  'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:7d67c08b5b993d72533f9bb07b6429c5a2263de8b67cc1b0ae09d4c0b0d39f97',
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
        observedGeneration: 16,
        details: {
          message: 'image change',
          causes: [
            {
              type: 'ImageChange',
              imageTrigger: {
                from: {
                  kind: 'DockerImage',
                  name:
                    'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py@sha256:7d67c08b5b993d72533f9bb07b6429c5a2263de8b67cc1b0ae09d4c0b0d39f97',
                },
              },
            },
          ],
        },
        availableReplicas: 1,
        unavailableReplicas: 0,
        latestVersion: 7,
        updatedReplicas: 1,
        conditions: [
          {
            type: 'Available',
            status: 'True',
            lastUpdateTime: '2020-01-13T10:35:13Z',
            lastTransitionTime: '2020-01-13T10:35:13Z',
            message: 'Deployment config has minimum availability.',
          },
          {
            type: 'Progressing',
            status: 'True',
            lastUpdateTime: '2020-01-13T17:59:39Z',
            lastTransitionTime: '2020-01-13T17:59:36Z',
            reason: 'NewReplicationControllerAvailable',
            message: 'replication controller "nationalparks-py-7" successfully rolled out',
          },
        ],
        replicas: 1,
        readyReplicas: 1,
      },
    },
  },
  route: {
    loaded: true,
    loadError: '',
    data: {
      kind: 'Route',
      apiVersion: 'route.openshift.io/v1',
      metadata: {
        name: 'nationalparks-py',
        namespace: 'div',
        selfLink: '/apis/route.openshift.io/v1/namespaces/div/routes/nationalparks-py',
        uid: 'e9f365ed-5c67-40b2-ab0b-b38544f943d3',
        resourceVersion: '329838',
        creationTimestamp: '2020-01-13T10:33:05Z',
        labels: {
          app: 'nationalparks-py',
          'app.kubernetes.io/component': 'nationalparks-py',
          'app.kubernetes.io/instance': 'nationalparks-py',
          'app.kubernetes.io/name': 'python',
          'app.openshift.io/runtime': 'python',
          'app.openshift.io/runtime-version': '3.6',
        },
        annotations: {
          'openshift.io/host.generated': 'true',
        },
      },
      spec: {
        host: 'nationalparks-py-div.apps.rorai-cluster34.devcluster.openshift.com',
        to: {
          kind: 'Service',
          name: 'nationalparks-py',
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
            host: 'nationalparks-py-div.apps.rorai-cluster34.devcluster.openshift.com',
            routerName: 'default',
            conditions: [
              {
                type: 'Admitted',
                status: 'True',
                lastTransitionTime: '2020-01-13T10:33:06Z',
              },
            ],
            wildcardPolicy: 'None',
            routerCanonicalHostname: 'apps.rorai-cluster34.devcluster.openshift.com',
          },
        ],
      },
    },
  },
  buildConfig: {
    loaded: true,
    loadError: '',
    data: {
      kind: 'BuildConfig',
      apiVersion: 'build.openshift.io/v1',
      metadata: {
        name: 'nationalparks-py',
        namespace: 'div',
        selfLink: '/apis/build.openshift.io/v1/namespaces/div/buildconfigs/nationalparks-py',
        uid: '8319b0c9-3674-4eb6-b0bb-3bcfc7211435',
        resourceVersion: '329844',
        creationTimestamp: '2020-01-13T10:33:05Z',
        labels: {
          app: 'nationalparks-py',
          'app.kubernetes.io/component': 'nationalparks-py',
          'app.kubernetes.io/instance': 'nationalparks-py',
          'app.kubernetes.io/name': 'python',
          'app.openshift.io/runtime': 'python',
          'app.openshift.io/runtime-version': '3.6',
        },
        annotations: {
          'app.openshift.io/vcs-ref': 'master',
          'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
        },
      },
      spec: {
        nodeSelector: null,
        output: {
          to: {
            kind: 'ImageStreamTag',
            name: 'nationalparks-py:latest',
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
              name: 'python:3.6',
            },
          },
        },
        postCommit: {},
        source: {
          type: 'Git',
          git: {
            uri: 'https://github.com/divyanshiGupta/nationalparks-py',
          },
          contextDir: '/',
        },
        triggers: [
          {
            type: 'Generic',
            generic: {
              secretReference: {
                name: 'nationalparks-py-generic-webhook-secret',
              },
            },
          },
          {
            type: 'GitHub',
            github: {
              secretReference: {
                name: 'nationalparks-py-github-webhook-secret',
              },
            },
          },
          {
            type: 'ImageChange',
            imageChange: {
              lastTriggeredImageID:
                'image-registry.openshift-image-registry.svc:5000/openshift/python@sha256:dde8883b3033d9b3d0e88b8c74304fba4b23cd5c07a164e71ee352b899a7803e',
            },
          },
          {
            type: 'ConfigChange',
          },
        ],
        runPolicy: 'Serial',
      },
      status: {
        lastVersion: 3,
      },
    },
  },
  imageStream: {
    loaded: true,
    loadError: '',
    data: [
      {
        kind: 'ImageStream',
        apiVersion: 'image.openshift.io/v1',
        metadata: {
          annotations: {
            'app.openshift.io/vcs-ref': 'master',
            'app.openshift.io/vcs-uri': 'https://github.com/divyanshiGupta/nationalparks-py',
          },
          selfLink: '/apis/image.openshift.io/v1/namespaces/div/imagestreams/nationalparks-py',
          resourceVersion: '676247',
          name: 'nationalparks-py',
          uid: '2bc985ac-f834-45e5-9a86-830edb6bc8bd',
          creationTimestamp: '2020-01-15T15:51:47Z',
          generation: 1,
          namespace: 'div',
          labels: {
            app: 'nationalparks-py',
            'app.kubernetes.io/component': 'nationalparks-py',
            'app.kubernetes.io/instance': 'nationalparks-py',
            'app.kubernetes.io/name': 'python',
            'app.kubernetes.io/part-of': 'nodejs-rest-http-app',
            'app.openshift.io/runtime': 'python',
            'app.openshift.io/runtime-version': '3.6',
          },
        },
        spec: {
          lookupPolicy: {
            local: false,
          },
        },
        status: {
          dockerImageRepository:
            'image-registry.openshift-image-registry.svc:5000/div/nationalparks-py',
        },
      },
    ],
  },
};

export const gitImportInitialValues: GitImportFormData = {
  formType: 'edit',
  name: 'nationalparks-py',
  application: { name: '', selectedKey: UNASSIGNED_KEY },
  project: { name: 'div' },
  route: {
    disable: true,
    create: true,
    targetPort: '8080-tcp',
    unknownTargetPort: '',
    defaultUnknownPort: 8080,
    path: '',
    hostname: 'nationalparks-py-div.apps.rorai-cluster34.devcluster.openshift.com',
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
  serverless: {
    scaling: {
      minpods: 0,
      maxpods: '',
      concurrencytarget: '',
      concurrencylimit: '',
    },
  },
  pipeline: { enabled: false },
  deployment: { env: [], triggers: { image: true, config: true }, replicas: 1 },
  labels: {},
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
      limit: '',
      limitUnit: 'Mi',
      defaultLimitUnit: 'Mi',
    },
  },
  git: {
    url: 'https://github.com/divyanshiGupta/nationalparks-py',
    type: 'github',
    ref: '',
    dir: '/',
    showGitType: false,
    secret: '',
    isUrlValidating: false,
  },
  docker: { dockerfilePath: 'Dockerfile', containerPort: 8080 },
  image: {
    selected: 'python',
    recommended: '',
    tag: '3.6',
    tagObj: {},
    ports: [],
    isRecommending: false,
    couldNotRecommend: false,
  },
  build: {
    env: [],
    triggers: { webhook: true, image: true, config: true },
    strategy: 'Source',
  },
  healthChecks: healthChecksProbeInitialData,
};

export const externalImageValues: DeployImageFormData = {
  formType: 'edit',
  name: 'nationalparks-py',
  application: { name: '', selectedKey: '#UNASSIGNED_KEY#' },
  project: { name: 'div' },
  route: {
    disable: true,
    create: true,
    targetPort: '8080-tcp',
    unknownTargetPort: '',
    defaultUnknownPort: 8080,
    path: '',
    hostname: 'nationalparks-py-div.apps.rorai-cluster34.devcluster.openshift.com',
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
  serverless: {
    scaling: {
      minpods: 0,
      maxpods: '',
      concurrencytarget: '',
      concurrencylimit: '',
    },
  },
  pipeline: { enabled: false },
  deployment: { env: [], triggers: { image: true, config: true }, replicas: 1 },
  labels: {},
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
      limit: '',
      limitUnit: 'Mi',
      defaultLimitUnit: 'Mi',
    },
  },
  searchTerm: undefined,
  registry: 'external',
  imageStream: { image: '', tag: '', namespace: '', grantAccess: true },
  isi: {
    name: '',
    image: {},
    tag: '',
    status: { metadata: {}, status: '' },
    ports: [],
  },
  image: {
    name: '',
    image: {},
    tag: '',
    status: { metadata: {}, status: '' },
    ports: [],
  },
  build: { env: [], triggers: {}, strategy: '' },
  isSearchingForImage: false,
  healthChecks: healthChecksProbeInitialData,
};

export const internalImageValues: DeployImageFormData = {
  formType: 'edit',
  name: 'nationalparks-py',
  application: { name: '', selectedKey: '#UNASSIGNED_KEY#' },
  project: { name: 'div' },
  route: {
    disable: true,
    create: true,
    targetPort: '8080-tcp',
    unknownTargetPort: '',
    defaultUnknownPort: 8080,
    path: '',
    hostname: 'nationalparks-py-div.apps.rorai-cluster34.devcluster.openshift.com',
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
  serverless: {
    scaling: {
      minpods: 0,
      maxpods: '',
      concurrencytarget: '',
      concurrencylimit: '',
    },
  },
  pipeline: { enabled: false },
  deployment: { env: [], triggers: { image: true, config: true }, replicas: 1 },
  labels: {},
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
      limit: '',
      limitUnit: 'Mi',
      defaultLimitUnit: 'Mi',
    },
  },
  searchTerm: '',
  registry: 'internal',
  imageStream: { image: 'python', tag: '3.6', namespace: 'div' },
  isi: {
    name: '',
    image: {},
    tag: '',
    status: { metadata: {}, status: '' },
    ports: [],
  },
  image: {
    name: '',
    image: {},
    tag: '',
    status: { metadata: {}, status: '' },
    ports: [],
  },
  build: { env: [], triggers: {}, strategy: '' },
  isSearchingForImage: false,
  healthChecks: healthChecksProbeInitialData,
};

export const knAppResources: AppResources = {
  editAppResource: {
    loaded: true,
    loadError: '',
    data: knativeService,
  },
  route: {
    loaded: false,
    loadError: 'routes.route.openshift.io "greeter" not found',
    data: {},
  },
  buildConfig: {
    loaded: false,
    loadError: 'Error: buildconfigs.build.openshift.io "greeter" not found',
    data: {},
  },
  imageStream: {
    loaded: true,
    loadError: '',
    data: [],
  },
};

export const knExternalImageValues: DeployImageFormData = {
  application: { name: '', selectedKey: '#UNASSIGNED_KEY#' },
  build: { env: [], strategy: '', triggers: {} },
  deployment: { env: [], replicas: 1, triggers: { image: false } },
  formType: 'edit',
  image: { image: {}, name: '', ports: [], status: { metadata: {}, status: '' }, tag: '' },
  imageStream: { grantAccess: true, image: '', namespace: '', tag: '' },
  isSearchingForImage: false,
  isi: { image: {}, name: '', ports: [], status: { metadata: {}, status: '' }, tag: '' },
  labels: {},
  limits: {
    cpu: {
      defaultLimitUnit: '',
      defaultRequestUnit: '',
      limit: '',
      limitUnit: '',
      request: '',
      requestUnit: '',
    },
    memory: {
      defaultLimitUnit: 'Mi',
      defaultRequestUnit: 'Mi',
      limit: '',
      limitUnit: 'Mi',
      request: '',
      requestUnit: 'Mi',
    },
  },
  name: 'nationalparks-py',
  pipeline: { enabled: false },
  project: { name: 'div' },
  registry: 'external',
  resources: Resources.KnativeService,
  route: {
    create: true,
    defaultUnknownPort: 8080,
    disable: true,
    hostname: '',
    path: '',
    secure: false,
    targetPort: '',
    tls: {
      caCertificate: '',
      certificate: '',
      destinationCACertificate: '',
      insecureEdgeTerminationPolicy: '',
      privateKey: '',
      termination: '',
    },
    unknownTargetPort: '',
  },
  searchTerm: 'openshift/hello-openshift',
  serverless: { scaling: { concurrencylimit: '', concurrencytarget: '', maxpods: '', minpods: 0 } },
  healthChecks: healthChecksProbeInitialData,
};

export const gitImportInitialValuesWithHealthChecksEnabled: GitImportFormData = {
  ...gitImportInitialValues,
  healthChecks: healthChecksData,
};
