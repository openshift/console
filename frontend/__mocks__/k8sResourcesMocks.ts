import { K8sResourceKind } from '../public/module/k8s';

export const testNamespace: K8sResourceKind = {
  apiVersion: 'v1',
  kind: 'Namespace',
  metadata: {
    name: 'default',
    annotations: { 'alm-manager': 'tectonic-system.alm-operator' },
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
