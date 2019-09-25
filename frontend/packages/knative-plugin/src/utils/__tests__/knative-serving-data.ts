import { DeployImageFormData } from '@console/dev-console/src/components/import/import-types';

export const defaultData: DeployImageFormData = {
  project: {
    name: '',
    displayName: '',
    description: '',
  },
  application: {
    initial: '',
    name: '',
    selectedKey: '',
  },
  name: '',
  searchTerm: '',
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
  isSearchingForImage: false,
  serverless: {
    enabled: false,
    scaling: {
      minpods: 1,
      maxpods: 5,
      concurrencytarget: 1,
      concurrencylimit: 1,
    },
  },
  route: {
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
      limit: '',
      limitUnit: 'm',
    },
    memory: {
      request: '',
      requestUnit: 'Mi',
      limit: '',
      limitUnit: 'Mi',
    },
  },
};
