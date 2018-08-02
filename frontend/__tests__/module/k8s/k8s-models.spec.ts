import { referenceFor, referenceForCRD, referenceForOwnerRef, referenceForModel, kindForReference, versionForReference } from '../../../public/module/k8s';
import { testNamespace, testClusterServiceVersion, testClusterServiceVersionResource, testOwnedResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import { PodModel, DeploymentModel } from '../../../public/models';

describe('referenceFor', () => {

  it('returns a reference for objects without an API group', () => {
    expect(referenceFor(testNamespace)).toEqual('core:v1:Namespace');
  });

  it('returns a reference for objects with an API group', () => {
    expect(referenceFor(testClusterServiceVersion)).toEqual('operators.coreos.com:v1alpha1:ClusterServiceVersion');
  });
});

describe('referenceForCRD', () => {

  it('returns a reference for custom resource definitions', () => {
    expect(referenceForCRD(testClusterServiceVersionResource)).toEqual('testapp.coreos.com:v1alpha1:TestResource');
  });
});

describe('referenceForOwnerRef', () => {

  it('returns a reference for an ownerRef', () => {
    expect(referenceForOwnerRef(testOwnedResourceInstance.metadata.ownerReferences[0])).toEqual('testapp.coreos.com:v1alpha1:TestResource');
  });
});

describe('referenceForModel', () => {

  it('returns a reference for a legacy k8s model', () => {
    expect(referenceForModel(PodModel)).toEqual('core:v1:Pod');
  });

  it('returns a reference for a non-legacy k8s model', () => {
    expect(referenceForModel(DeploymentModel)).toEqual('apps:v1:Deployment');
  });
});

describe('kindForReference', () => {

  it('returns the kind from a given reference', () => {
    expect(kindForReference(referenceFor(testNamespace))).toEqual('Namespace');
  });

  it('returns the given reference if it is already a kind', () => {
    const kind = 'Pod';
    expect(kindForReference(kind)).toEqual(kind);
  });
});

describe('versionForReference', () => {

  it('returns the API version for a given reference', () => {
    expect(versionForReference(referenceFor(testClusterServiceVersion))).toEqual('v1alpha1');
  });
});
