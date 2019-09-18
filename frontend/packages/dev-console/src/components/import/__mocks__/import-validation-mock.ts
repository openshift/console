import { GitImportFormData } from '../import-types';

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
    type: 'github',
    ref: '',
    dir: '',
    showGitType: false,
    secret: '',
  },
  docker: {
    dockerfilePath: 'Dockerfile',
    containerPort: 8080,
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
  serverless: {
    enabled: false,
    scaling: {
      minpods: 0,
      maxpods: '',
      concurrencytarget: '',
      concurrencylimit: '',
    },
  },
  limits: {
    cpu: {
      request: '',
      requestUnit: 'millicores',
      limit: '',
      limitUnit: 'millicores',
    },
    memory: {
      request: '',
      requestUnit: 'MiB',
      limit: '',
      limitUnit: 'MiB',
    },
  },
};
