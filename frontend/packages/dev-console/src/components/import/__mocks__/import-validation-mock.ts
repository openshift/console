import { GitImportFormData } from '../import-types';

export const mockFormData: GitImportFormData = {
  name: 'test-app',
  project: {
    name: 'mock-project',
  },
  application: {
    name: 'mock-app',
    selectedKey: 'mock-app',
  },
  git: {
    url: 'https://github.com/test/repo',
    type: 'github',
    ref: '',
    dir: '',
    showGitType: false,
    secret: '',
  },
  image: {
    selected: 'nodejs',
    recommended: '',
    tag: 'latest',
    tagObj: {},
    ports: [],
  },
  route: {
    create: false,
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
  build: {
    env: [],
    triggers: {
      webhook: true,
      image: true,
      config: true,
    },
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
  serverless: {
    trigger: false,
    scaling: {
      minpods: 0,
      maxpods: '',
      concurrencytarget: '',
      concurrencylimit: '',
    },
  },
  limits: {
    cpu: {
      request: null,
      requestUnit: 'millicores',
      limit: null,
      limitUnit: 'millicores',
    },
    memory: {
      request: null,
      requestUnit: 'MiB',
      limit: null,
      limitUnit: 'MiB',
    },
  },
};
