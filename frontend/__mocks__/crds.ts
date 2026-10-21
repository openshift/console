import { CRDVersion, CustomResourceDefinitionKind } from '../public/module/k8s';

export const testCRD: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1',
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
    versions: [
      {
        name: 'v1alpha1',
        storage: true,
        served: true,
        schema: {
          openAPIV3Schema: {},
        },
      },
    ],
    names: {
      kind: 'TestResource',
      plural: 'testresources',
      singular: 'testresource',
      listKind: 'TestResourceList',
    },
    scope: 'Namespaced',
  },
};

export const testCRDVersionV1Alpha1: CRDVersion = {
  name: 'v1alpha1',
  storage: true,
  served: true,
  schema: {
    openAPIV3Schema: {},
  },
};

export const testCRDVersionV1Alpha2: CRDVersion = {
  name: 'v1alpha2',
  storage: true,
  served: true,
  schema: {
    openAPIV3Schema: {},
  },
};

export const testCRDVersionV8Unserved: CRDVersion = {
  name: 'v8',
  storage: true,
  served: false,
  schema: {
    openAPIV3Schema: {},
  },
};

export const testCRDVersionV2Beta1: CRDVersion = {
  name: 'v2beta1',
  storage: true,
  served: true,
  schema: {
    openAPIV3Schema: {},
  },
};

export const testCRDVersionV2Alpha1: CRDVersion = {
  name: 'v2alpha1',
  storage: true,
  served: true,
  schema: {
    openAPIV3Schema: {},
  },
};

export const testCRDVersionV3Beta1: CRDVersion = {
  name: 'v3beta1',
  storage: true,
  served: true,
  schema: {
    openAPIV3Schema: {},
  },
};

export const testCRDVersionV1: CRDVersion = {
  name: 'v1',
  storage: true,
  served: true,
  schema: {
    openAPIV3Schema: {},
  },
};

export const testCRDInvalidVersion: CRDVersion = {
  name: 'versionthreedotone',
  storage: true,
  served: true,
  schema: {
    openAPIV3Schema: {},
  },
};

export const testCRDInvalidVersionTwo: CRDVersion = {
  name: '7.45',
  storage: true,
  served: true,
  schema: {
    openAPIV3Schema: {},
  },
};

export const testForValidVersionsCRD: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresources.testapp.coreos.com',
  },
  spec: {
    group: 'testapp.coreos.com',
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
    scope: 'Namespaced',
  },
};

export const testForUnservedVersionsCRD: CustomResourceDefinitionKind = {
  apiVersion: 'apiextensions.k8s.io/v1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'testresources.testapp.coreos.com',
  },
  spec: {
    group: 'testapp.coreos.com',
    versions: [testCRDVersionV8Unserved],
    names: {
      kind: 'TestResource',
      plural: 'testresources',
      singular: 'testresource',
      listKind: 'TestResourceList',
    },
    scope: 'Namespaced',
  },
};
