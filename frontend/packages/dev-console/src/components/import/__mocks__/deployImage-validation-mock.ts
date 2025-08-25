import { healthChecksProbeInitialData } from '../../health-checks/health-checks-probe-utils';
import {
  DeployImageFormData,
  InsecureTrafficType,
  Resources,
  TerminationType,
} from '../import-types';
import { serverlessInitialValues } from './serverless-mock';

export const mockDeployImageFormData: DeployImageFormData = {
  project: {
    name: 'mock-project',
    displayName: '',
    description: '',
  },
  application: {
    initial: 'mock-app',
    name: 'mock-app',
    selectedKey: 'mock-app',
  },
  name: 'test-app',
  runtimeIcon: undefined,
  searchTerm: 'test-app',
  registry: 'external',
  allowInsecureRegistry: false,
  imageStream: {
    image: '',
    tag: '',
    namespace: '',
  },
  isi: {
    image: {
      dockerImageLayers: [
        {
          name: 'sha256:8f91359f1fffbf32b24ca854fb263d88a222371f38e90cf4583c5742cfdc3039',
          size: 22510654,
          mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip',
        },
        {
          name: 'sha256:e6e554c0af6fbe639e85531e90ab893e221666cb8c9c87e5e260a3cebadfc4da',
          size: 4501229,
          mediaType: 'application/vnd.docker.image.rootfs.diff.tar.gzip',
        },
      ],
      dockerImageManifestMediaType: 'application/vnd.docker.distribution.manifest.v2+json',
      dockerImageMetadata: {
        Architecture: 'amd64',
        Config: {
          cmd: ['test'],
          Entrypoint: ['docker-entrypoint.sh'],
          Image: 'sha256:231b50bbbc3f4606a0a7c527c63f9d447e7c18592433bf82ad4692787bf925ab',
        },
        Container: 'e03bd283544a70575c453759ead333056c2112e485ff51b2df4656d28e27c6dd',
        Created: '2019-09-12T04:24:43Z',
        DockerVersion: '18.06.1-ce',
        Id: 'sha256:b8fd9553f1f06e56173db706cf47dfc64ae3a7aeb213cc0e4fc476983b62bf16',
        Size: 129977572,
        apiVersion: '1.0',
        kind: 'DockerImage',
        dockerImageMetadataVersion: '1.0',
        dockerImageReference:
          'mysql@sha256:2e4114bdc9dd797549f6df0cffb5f6cb6354bef9d96223a5935b6b17aea03840',
      },
      metadata: {
        annotations: {
          'image.openshift.io/dockerLayersOrder': 'ascending',
        },
        creationTimestamp: null,
        name: 'sha256:2e4114bdc9dd797549f6df0cffb5f6cb6354bef9d96223a5935b6b17aea03840',
      },
    },
    name: 'myimage',
    tag: 'latest',
    status: { metadata: {}, status: 'success' },
    ports: [],
  },
  image: {
    name: '',
    image: {},
    tag: 'latest',
    status: { metadata: {}, status: '' },
    ports: [],
  },
  isSearchingForImage: false,
  resources: Resources.OpenShift,
  serverless: serverlessInitialValues,
  route: {
    create: true,
    targetPort: '',
    defaultUnknownPort: 8080,
    path: '',
    hostname: '',
    secure: false,
    tls: {
      termination: 'None' as TerminationType,
      insecureEdgeTerminationPolicy: 'None' as InsecureTrafficType,
      caCertificate: '',
      certificate: '',
      destinationCACertificate: '',
      key: '',
    },
  },
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
  env: {},
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
  healthChecks: healthChecksProbeInitialData,
};

export const mockImageStreamData = {
  apiVersion: 'image.openshift.io/v1',
  kind: 'ImageStream',
  metadata: {
    labels: {
      app: 'test-app',
      'app.kubernetes.io/component': 'test-app',
      'app.kubernetes.io/instance': 'test-app',
      'app.kubernetes.io/part-of': 'mock-app',
      'app.kubernetes.io/name': 'test-app',
    },
    name: 'test-app',
    namespace: 'mock-project',
  },
  spec: {
    tags: [
      {
        name: 'latest',
        annotations: {
          'openshift.io/generated-by': 'OpenShiftWebConsole',
          'openshift.io/imported-from': 'myimage',
        },
        from: { kind: 'DockerImage', name: 'myimage' },
        importPolicy: { insecure: false },
        referencePolicy: { type: 'Local' },
      },
    ],
  },
};
