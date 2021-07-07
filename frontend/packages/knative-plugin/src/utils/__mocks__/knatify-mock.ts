import { serverlessInitialValues } from '@console/dev-console/src/components/import/__mocks__/serverless-mock';
import { K8sResourceKind } from '@console/internal/module/k8s';

export const ksvcData: K8sResourceKind = {
  kind: 'Service',
  apiVersion: 'serving.knative.dev/v1',
  metadata: {
    name: 'ksvc-overlayimage',
    namespace: 'testproject3',
    labels: {
      'app.kubernetes.io/component': 'ksvc-overlayimage',
      'app.kubernetes.io/instance': 'ksvc-overlayimage',
      'app.kubernetes.io/part-of': 'application-3',
    },
    annotations: { 'deployment.kubernetes.io/revision': '1' },
  },
  spec: {
    template: {
      metadata: { labels: { app: 'hello-openshift' }, annotations: {} },
      spec: {
        containers: [
          {
            name: 'overlayimage',
            image: 'openshift/hello-openshift',
            ports: [{ containerPort: 8080 }],
            imagePullPolicy: 'Always',
            resources: {},
          },
        ],
      },
    },
  },
};

export const knatifyFormCommonInitialValues = {
  name: 'ksvc-overlayimage',
  formType: 'knatify',
  application: { name: 'application-3', selectedKey: 'application-3' },
  project: { name: 'testproject3' },
  route: {
    create: true,
    unknownTargetPort: '8080',
    targetPort: '8080',
    defaultUnknownPort: 8080,
  },
  resources: 'knative',
  serverless: serverlessInitialValues,
  pipeline: { enabled: false },
  deployment: { env: [], replicas: 1, triggers: { image: false } },
  labels: { 'app.kubernetes.io/component': 'ksvc-overlayimage' },
  annotations: { 'deployment.kubernetes.io/revision': '1' },
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
  healthChecks: {
    readinessProbe: {
      showForm: false,
      modified: false,
      enabled: false,
      data: {
        failureThreshold: '3',
        requestType: 'httpGet',
        httpGet: { scheme: undefined, path: '/', port: '8080', httpHeaders: [] },
        tcpSocket: { port: '8080' },
        exec: { command: [''] },
        initialDelaySeconds: '0',
        periodSeconds: '10',
        timeoutSeconds: '1',
        successThreshold: '1',
      },
    },
    livenessProbe: {
      showForm: false,
      modified: false,
      enabled: false,
      data: {
        failureThreshold: '3',
        requestType: 'httpGet',
        httpGet: { scheme: undefined, path: '/', port: '8080', httpHeaders: [] },
        tcpSocket: { port: '8080' },
        exec: { command: [''] },
        initialDelaySeconds: '0',
        periodSeconds: '10',
        timeoutSeconds: '1',
        successThreshold: '1',
      },
    },
    startupProbe: {
      showForm: false,
      modified: false,
      enabled: false,
      data: {
        failureThreshold: '3',
        requestType: 'httpGet',
        httpGet: { scheme: undefined, path: '/', port: '8080', httpHeaders: [] },
        tcpSocket: { port: '8080' },
        exec: { command: [''] },
        initialDelaySeconds: '0',
        periodSeconds: '10',
        timeoutSeconds: '1',
        successThreshold: '1',
      },
    },
  },
};

export const imageStremsData: K8sResourceKind[] = [
  {
    kind: 'ImageStream',
    apiVersion: 'image.openshift.io/v1',
    metadata: {
      annotations: {
        'app.openshift.io/vcs-ref': '',
        'app.openshift.io/vcs-uri': 'https://github.com/sclorg/ruby-ex.git',
        'openshift.io/generated-by': 'OpenShiftWebConsole',
      },
      resourceVersion: '552606',
      name: 'ruby-ex-git-dc',
      uid: '6c38fbc5-9f8d-4369-b26b-66000427e210',
      creationTimestamp: '2021-02-24T10:26:52Z',
      generation: 1,
      managedFields: [
        {
          manager: 'Mozilla',
          operation: 'Update',
          apiVersion: 'image.openshift.io/v1',
          time: '2021-02-24T10:26:52Z',
          fieldsType: 'FieldsV1',
          fieldsV1: {
            'f:metadata': {
              'f:annotations': {
                '.': {},
                'f:app.openshift.io/vcs-ref': {},
                'f:app.openshift.io/vcs-uri': {},
                'f:openshift.io/generated-by': {},
              },
              'f:labels': {
                '.': {},
                'f:app': {},
                'f:app.kubernetes.io/component': {},
                'f:app.kubernetes.io/instance': {},
                'f:app.kubernetes.io/name': {},
                'f:app.openshift.io/runtime': {},
                'f:app.openshift.io/runtime-version': {},
              },
            },
          },
        },
      ],
      namespace: 'testproject3',
      labels: {
        app: 'ruby-ex-git-dc',
        'app.kubernetes.io/component': 'ruby-ex-git-dc',
        'app.kubernetes.io/instance': 'ruby-ex-git-dc',
        'app.kubernetes.io/name': 'perl',
        'app.openshift.io/runtime': 'perl',
        'app.openshift.io/runtime-version': '5.30-el7',
      },
    },
    spec: { lookupPolicy: { local: false } },
    status: {
      dockerImageRepository:
        'image-registry.openshift-image-registry.svc:5000/testproject3/ruby-ex-git-dc',
      tags: [
        {
          tag: 'latest',
          items: [
            {
              created: '2021-02-24T10:27:35Z',
              dockerImageReference:
                'image-registry.openshift-image-registry.svc:5000/testproject3/ruby-ex-git-dc@sha256:731442c798a6afd04c4b2a97c29eb55993df87ee861185b736097ea72959d0bc',
              image: 'sha256:731442c798a6afd04c4b2a97c29eb55993df87ee861185b736097ea72959d0bc',
              generation: 1,
            },
          ],
        },
      ],
    },
  },
];
