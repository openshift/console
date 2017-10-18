/* eslint-disable no-undef, no-unused-vars */

import { AppTypeKind, AppTypeResourceKind, CustomResourceDefinitionKind, ALMStatusDescriptors, K8sResourceKind, CatalogEntryKind, InstallPlanKind, ClusterServiceVersionPhase, CSVConditionReason } from '../public/components/cloud-services';

export const testNamespace: K8sResourceKind = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'default',
  }
};

export const testAppType: AppTypeKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'AppType-v1',
  metadata: {
    name: 'testapp',
    uid: 'c02c0a8f-88e0-11e7-851b-080027b424ef',
    creationTimestamp: '2017-09-20T18:19:49Z',
    namespace: 'default',
  },
  spec: {
    displayName: 'Test App',
    description: 'This app does cool stuff',
    provider: {
      name: 'MyCompany, Inc',
    },
    links: [
      {name: 'Documentation', url: 'https://docs.testapp.com'},
    ],
    maintainers: [
      {name: 'John Doe', email: 'johndoe@example.com'},
    ],
    icon: [
      {base64data: '', mediatype: 'image/png',}
    ],
    labels: {
      'alm-owner-testapp': 'testapp.apptype-v1s.app.coreos.com.v1alpha1',
      'alm-catalog': 'open-cloud-services.coreos.com',
    },
    selector: {
      matchLabels: {
        'alm-owner-testapp': 'testapp.apptype-v1s.app.coreos.com.v1alpha1'
      }
    },
    customresourcedefinitions: {
      owned: [{
        'name': 'testresource.testapp.coreos.com',
        'displayName': 'Test Resource',
        'statusDescriptors': [{
          'path': 'importantMetrics',
          'displayName': 'Important Metrics',
          'description': 'Important prometheus metrics ',
          'x-descriptors': [ALMStatusDescriptors.importantMetrics],
          'value': {
            'queries': [{
              'query': 'foobarbaz',
              'name': 'something',
              'type': 'gauge',
            }],
          }
        },
        {
          'path': 'some-unfilled-path',
          'displayName': 'Some Unfilled Path',
          'description': 'This status is unfilled in the tests',
          'x-descriptors': [ALMStatusDescriptors.text],
        },
        {
          'path': 'some-filled-path',
          'displayName': 'Some Status',
          'description': 'This status is filled',
          'x-descriptors': [ALMStatusDescriptors.text],
        }]
      }]
    }
  },
  status: {
    phase: ClusterServiceVersionPhase.CSVPhaseSucceeded,
    reason: CSVConditionReason.CSVReasonInstallSuccessful,
  },
};

export const localAppType: AppTypeKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'AppType-v1',
  metadata: {
    name: 'local-testapp',
    uid: 'c02c0a8f-88e0-12e7-851b-080027b424ef',
    creationTimestamp: '2017-08-20T18:19:49Z',
    namespace: 'default',
  },
  spec: {
    displayName: 'Local Test App',
    description: 'This app does cool stuff - locally',
    labels: {
      'alm-owner-local-testapp': 'local-testapp.apptype-v1s.app.coreos.com.v1alpha1',
    },
    selector: {
      matchLabels: {
        'alm-owner-local-testapp': 'local-testapp.apptype-v1s.app.coreos.com.v1alpha1'
      }
    },
    customresourcedefinitions: {
      owned: [],
    },
  },
};

export const testAppTypeResource: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1beta1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresource.testapp.coreos.com',
    labels: {
      'owner-testapp': 'testapp.apptype-v1s.coreos.com',
    },
    annotations: {
      displayName: 'Dashboard',
      description: 'Test Dashboard',
    }
  },
  spec: {
    group: 'testapp.coreos.com',
    version: 'v1alpha1',
    names: {
      kind: 'TestResource'
    },
  }
};

export const testResourceInstance: AppTypeResourceKind = {
  apiVersion: 'testapp.coreos.com',
  kind: 'TestResource',
  metadata: {
    name: 'my-test-resource',
    uid: 'c02c0a8f-88e0-12e7-851b-081027b424ef',
    creationTimestamp: '2017-06-20T18:19:49Z',
    labels: {},
  },
  spec: {
    labels: {
      'owner-testapp': 'testapp.apptype-v1s.app.coreos.com',
    },
    selector: {
      matchLabels: {
        'peanut': 'butter',
        'jelly': 'time',
      }
    }
  },
  status: {
    'some-filled-path': 'this is filled!',
  },
};

export const testCatalogApp: CatalogEntryKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'AlphaCatalogEntrySpec',
  metadata: {
    name: 'testapp',
    uid: 'c02c0a8f-88e0-11e7-851b-080027b424ef',
    creationTimestamp: '2017-09-20T18:19:49Z',
    namespace: 'default',
  },
  spec: {
    displayName: 'Test App',
    description: 'This app does cool stuff',
    provider: 'MyCompany, Inc',
    links: [
      {name: 'Documentation', url: 'https://docs.testapp.com'},
    ],
    maintainers: [
      {name: 'John Doe', email: 'johndoe@example.com'},
    ],
    icon: [
      {base64data: '', mediatype: 'image/png',}
    ],
    labels: {
      'alm-owner-testapp': 'testapp.apptype-v1s.app.coreos.com.v1alpha1',
      'alm-catalog': 'open-cloud-services.coreos.com',
    },
  },
};

export const testInstallPlan: InstallPlanKind = {
  apiVersion: 'app.coreos.com/v1alpha1',
  kind: 'InstallPlan-v1',
  metadata: {
    namespace: 'default',
    name: 'etcd',
  },
  spec: {
    clusterServiceVersionNames: ['etcd'],
    approval: 'Automatic',
  },
  status: {
    status: 'Complete',
    plan: [],
  },
};
