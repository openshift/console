import { CRDVersion, CustomResourceDefinitionKind, K8sResourceKind } from '../public/module/k8s';

export const testNamespace: K8sResourceKind = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'default',
    annotations: { 'alm-manager': 'tectonic-system.alm-operator' },
  },
};

export const testCRD: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1beta1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresources.testapp.coreos.com',
    labels: {
      'owner-testapp': 'testapp.clusterserviceversions.coreos.com',
    },
    annotations: {
      displayName: 'Dashboard',
      description: 'Test Dashboard',
    },
  },
  spec: {
    group: 'testapp.coreos.com',
    version: 'v1alpha1',
    validation: {
      openAPIV3Schema: {},
    },
    names: {
      kind: 'TestResource',
      plural: 'testresources',
      singular: 'testresource',
      listKind: 'TestResourceList',
    },
  },
};

export const testResourceInstance: K8sResourceKind = {
  apiVersion: 'testapp.coreos.com/v1alpha1',
  kind: 'TestResource',
  metadata: {
    name: 'my-test-resource',
    namespace: 'default',
    uid: 'c02c0a8f-88e0-12e7-851b-081027b424ef',
    creationTimestamp: '2017-06-20T18:19:49Z',
  },
  spec: {
    selector: {
      matchLabels: {
        fizz: 'buzz',
      },
    },
  },
  status: {
    'some-filled-path': 'this is filled!',
  },
};

export const testOwnedResourceInstance: K8sResourceKind = {
  apiVersion: 'testapp.coreos.com/v1alpha1',
  kind: 'TestOwnedResource',
  metadata: {
    name: 'owned-test-resource',
    uid: '62fa5eac-3df4-448d-a576-916dd5b432f2',
    creationTimestamp: '2005-02-20T18:13:42Z',
    ownerReferences: [
      {
        name: testResourceInstance.metadata.name,
        kind: 'TestResource',
        apiVersion: testResourceInstance.apiVersion,
        uid: testResourceInstance.metadata.uid,
      },
    ],
  },
  spec: {},
  status: {
    'some-filled-path': 'this is filled!',
  },
};

export const testCRDVersionV1Alpha1: CRDVersion = {
  name: 'v1alpha1',
  storage: true,
  served: true,
};

export const testCRDVersionV1Alpha2: CRDVersion = {
  name: 'v1alpha2',
  storage: true,
  served: true,
};

export const testCRDVersionV8Unserved: CRDVersion = {
  name: 'v8',
  storage: true,
  served: false,
};

export const testCRDVersionV2Beta1: CRDVersion = {
  name: 'v2beta1',
  storage: true,
  served: true,
};

export const testCRDVersionV2Alpha1: CRDVersion = {
  name: 'v2alpha1',
  storage: true,
  served: true,
};

export const testCRDVersionV3Beta1: CRDVersion = {
  name: 'v3beta1',
  storage: true,
  served: true,
};

export const testCRDVersionV1: CRDVersion = {
  name: 'v1',
  storage: true,
  served: true,
};

export const testCRDInvalidVersion: CRDVersion = {
  name: 'versionthreedotone',
  storage: true,
  served: true,
};

export const testCRDInvalidVersionTwo: CRDVersion = {
  name: '7.45',
  storage: true,
  served: true,
};

export const testForValidVersionsCRD: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1beta1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresources.testapp.coreos.com',
  },
  spec: {
    group: 'testapp.coreos.com',
    version: 'wrong-version',
    versions: [
      testCRDVersionV1Alpha1,
      testCRDVersionV1Alpha2,
      testCRDVersionV8Unserved,
      testCRDVersionV2Beta1,
      testCRDVersionV2Alpha1,
      testCRDVersionV3Beta1,
      testCRDVersionV1,
    ],
    names: {
      kind: 'TestResource',
      plural: 'testresources',
      singular: 'testresource',
      listKind: 'TestResourceList',
    },
  },
};

export const testForUnservedVersionsCRD: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1beta1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresources.testapp.coreos.com',
  },
  spec: {
    group: 'testapp.coreos.com',
    version: 'correct-version',
    versions: [testCRDVersionV8Unserved],
    names: {
      kind: 'TestResource',
      plural: 'testresources',
      singular: 'testresource',
      listKind: 'TestResourceList',
    },
  },
};

export const testForInvalidVersionsCRD: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1beta1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresources.testapp.coreos.com',
  },
  spec: {
    group: 'testapp.coreos.com',
    version: 'correct-version',
    versions: [testCRDInvalidVersion, testCRDInvalidVersionTwo],
    names: {
      kind: 'TestResource',
      plural: 'testresources',
      singular: 'testresource',
      listKind: 'TestResourceList',
    },
  },
};

export const testForNoVersionsCRD: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1beta1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresources.testapp.coreos.com',
  },
  spec: {
    group: 'testapp.coreos.com',
    version: 'correct-version',
    names: {
      kind: 'TestResource',
      plural: 'testresources',
      singular: 'testresource',
      listKind: 'TestResourceList',
    },
  },
};
