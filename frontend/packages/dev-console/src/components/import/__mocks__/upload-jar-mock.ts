import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { healthChecksProbeInitialData } from '../../health-checks/health-checks-probe-utils';
import { Resources, UploadJarFormData } from '../import-types';
import { serverlessInitialValues } from './serverless-mock';

export const uploadJarMockFormData: UploadJarFormData = {
  project: {
    name: 'my-app',
    displayName: '',
    description: '',
  },
  application: {
    initial: '',
    name: '',
    selectedKey: UNASSIGNED_KEY,
  },
  name: 'java-ex-git',
  fileUpload: {
    name: 'springApp.jar',
    value: '',
  },
  image: {
    selected: 'java',
    recommended: '',
    tag: 'openjdk-11-el7',
    tagObj: {
      name: 'openjdk-11-el7',
      annotations: {
        description: 'Build and run Java applications using Maven and OpenJDK 11.',
        iconClass: 'icon-rh-openjdk',
        'openshift.io/display-name': 'Red Hat OpenJDK 11 (RHEL 7)',
        sampleContextDir: 'undertow-servlet',
        sampleRepo: 'https://github.com/jboss-openshift/openshift-quickstarts',
        supports: 'java:11,java',
        tags: 'builder,java,openjdk',
        version: '11',
      },
      from: { kind: 'DockerImage', name: 'registry.redhat.io/openjdk/openjdk-11-rhel7:latest' },
      generation: 2,
      importPolicy: {},
      referencePolicy: { type: 'Local' },
    },
    ports: [
      { containerPort: 8080, protocol: 'TCP' },
      { containerPort: 8443, protocol: 'TCP' },
      { containerPort: 8778, protocol: 'TCP' },
    ],
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
    triggers: {},
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
  healthChecks: healthChecksProbeInitialData,
};
