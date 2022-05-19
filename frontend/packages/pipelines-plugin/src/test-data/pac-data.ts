import { RouteKind, SecretKind } from '@console/internal/module/k8s';
import { PAC_GH_APP_NAME } from '../components/pac/const';

export const sampleSecretData: SecretKind = {
  kind: 'Secret',
  apiVersion: 'v1',
  metadata: {
    name: 'pipelines-as-code-secret',
    namespace: 'openshift-pipelines',
    uid: '9bedeb70-32fa-4942-baf1-aca03dfe9d6c',
    resourceVersion: '243043',
    creationTimestamp: '2022-04-22T07:38:23Z',
    annotations: {
      appName: PAC_GH_APP_NAME,
      appUrl: 'https://github.com/apps/pipelines-ci-clustername',
    },
    managedFields: [
      {
        manager: 'Mozilla',
        operation: 'Update',
        apiVersion: 'v1',
        time: '2022-04-22T07:38:23Z',
        fieldsType: 'FieldsV1',
        fieldsV1: {
          'f:data': {
            '.': {},
            'f:github-application-id': {},
            'f:github-private-key': {},
            'f:webhook.secret': {},
          },
          'f:metadata': { 'f:annotations': { '.': {}, 'f:appName': {}, 'f:appUrl': {} } },
          'f:type': {},
        },
      },
    ],
  },
  data: {
    'github-application-id': 'MTkzNjU2',
    'github-private-key': 'abdg897',
    'webhook.secret': 'M2FlMWMwZDM==',
  },
  type: 'Opaque',
};

export const routeELData: RouteKind = {
  apiVersion: 'v1',
  kind: 'Route',
  metadata: {
    name: 'example',
  },
  spec: {
    host: 'www.example.com',
    tls: {
      termination: 'edge',
    },
    wildcardPolicy: 'None',
    to: {
      kind: 'Service',
      name: 'my-service',
      weight: 100,
    },
  },
  status: {
    ingress: [
      {
        host: 'www.example.com',
        conditions: [
          {
            type: 'Admitted',
            status: 'True',
            lastTransitionTime: '2018-04-30T16:55:48Z',
          },
        ],
      },
    ],
  },
};
