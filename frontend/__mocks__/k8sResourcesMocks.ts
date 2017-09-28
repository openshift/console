/* eslint-disable no-undef, no-unused-vars */

import { AppTypeKind, AppTypeResourceKind, CustomResourceDefinitionKind, K8sResourceKind, CatalogEntryKind, InstallPlanKind, ClusterServiceVersionPhase, CSVConditionReason } from '../public/components/cloud-services';

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
    }
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
      outputs: JSON.stringify({
        'testapp-dashboard': {
          'displayName': 'TestApp Dashboard',
          'description': 'GUI service dashboard',
          'x-alm-capabilities': [],
        },
        'testapp-metrics': {
          'displayName': 'Prometheus Metrics',
          'description': 'Prometheus Metrics chart',
          'x-alm-capabilities': ['urn:alm:capability:com.tectonic.ui:metrics'],
        }
      }),
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
  outputs: {
    'testapp-dashboard': 'https://testapp.io/dashboard',
    'testapp-metrics': JSON.stringify({
      metrics: [{query: 'has_leader', name: 'Has Active Leader', type: 'Gauge', subtype: 'boolean'}],
      endpoint: 'https://prometheus.testapp.com',
    })
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
    clusterServiceVersions: ['etcd'],
    approval: 'Automatic',
  },
  status: {
    status: 'Complete',
    plan: [],
  },
};
