import { healthChecksProbeInitialData } from '../../health-checks/health-checks-probe-utils';
import { GitImportFormData, GitTypes, Resources } from '../import-types';
import { serverlessInitialValues } from './serverless-mock';

export const mockFormData: GitImportFormData = {
  name: 'test-app',
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
  git: {
    url: 'https://github.com/test/repo',
    type: GitTypes.github,
    ref: '',
    dir: '',
    showGitType: false,
    secret: '',
    isUrlValidating: false,
  },
  docker: {
    dockerfilePath: 'Dockerfile',
  },
  image: {
    selected: 'nodejs',
    recommended: '',
    tag: 'latest',
    tagObj: {},
    ports: [],
    isRecommending: false,
    couldNotRecommend: false,
  },
  route: {
    create: false,
    targetPort: '',
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
  resources: Resources.OpenShift,
  serverless: serverlessInitialValues,
  limits: {
    cpu: {
      request: null,
      requestUnit: 'm',
      defaultRequestUnit: 'm',
      limit: null,
      limitUnit: 'm',
      defaultLimitUnit: 'm',
    },
    memory: {
      request: null,
      requestUnit: 'Mi',
      defaultRequestUnit: 'Mi',
      limit: null,
      limitUnit: 'Mi',
      defaultLimitUnit: 'Mi',
    },
  },
  healthChecks: healthChecksProbeInitialData,
};
