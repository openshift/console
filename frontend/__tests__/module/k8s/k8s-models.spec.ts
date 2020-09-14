import {
  apiVersionCompare,
  getLatestVersionForCRD,
  referenceFor,
  referenceForCRD,
  referenceForOwnerRef,
  referenceForModel,
  kindForReference,
  versionForReference,
  modelsToMap,
} from '../../../public/module/k8s';
import {
  testCRD,
  testCRDInvalidVersion,
  testCRDInvalidVersionTwo,
  testCRDVersionV1Alpha1,
  testCRDVersionV1Alpha2,
  testCRDVersionV8Unserved,
  testCRDVersionV2Beta1,
  testCRDVersionV2Alpha1,
  testCRDVersionV3Beta1,
  testCRDVersionV1,
  testForValidVersionsCRD,
  testForUnservedVersionsCRD,
} from '../../../__mocks__/crds';
import { testNamespace, testOwnedResourceInstance } from '../../../__mocks__/k8sResourcesMocks';
import {
  PodModel,
  DeploymentModel,
  ClusterResourceQuotaModel,
  PrometheusModel,
} from '../../../public/models';

describe('referenceFor', () => {
  it('returns a reference for objects without an API group', () => {
    expect(referenceFor(testNamespace)).toEqual('core~v1~Namespace');
  });

  it('returns a reference for objects with an API group', () => {
    expect(referenceFor(testOwnedResourceInstance)).toEqual(
      'testapp.coreos.com~v1alpha1~TestOwnedResource',
    );
  });
});

describe('referenceForCRD', () => {
  it('returns a reference for custom resource definitions', () => {
    expect(referenceForCRD(testCRD)).toEqual('testapp.coreos.com~v1alpha1~TestResource');
  });
});

describe('referenceForOwnerRef', () => {
  it('returns a reference for an ownerRef', () => {
    expect(referenceForOwnerRef(testOwnedResourceInstance.metadata.ownerReferences[0])).toEqual(
      'testapp.coreos.com~v1alpha1~TestResource',
    );
  });
});

describe('referenceForModel', () => {
  it('returns a reference for a legacy k8s model', () => {
    expect(referenceForModel(PodModel)).toEqual('core~v1~Pod');
  });

  it('returns a reference for a non-legacy k8s model', () => {
    expect(referenceForModel(DeploymentModel)).toEqual('apps~v1~Deployment');
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
    expect(versionForReference(referenceFor(testOwnedResourceInstance))).toEqual('v1alpha1');
  });
});

describe('modelsToMap', () => {
  it('returns a map with keys based on model.kind for models with crd:false', () => {
    expect(modelsToMap([PodModel, DeploymentModel]).toObject()).toEqual({
      [PodModel.kind]: PodModel,
      [DeploymentModel.kind]: DeploymentModel,
    });
  });

  it('returns a map with keys based on referenceForModel for models with crd:true', () => {
    expect(modelsToMap([ClusterResourceQuotaModel, PrometheusModel]).toObject()).toEqual({
      [referenceForModel(ClusterResourceQuotaModel)]: ClusterResourceQuotaModel,
      [referenceForModel(PrometheusModel)]: PrometheusModel,
    });
  });
});

describe('crdVersionSort', () => {
  it('returns a CRDVersion array in correct sort order', () => {
    expect(
      [
        testCRDVersionV1Alpha1.name,
        testCRDVersionV1Alpha2.name,
        testCRDVersionV8Unserved.name,
        testCRDVersionV2Beta1.name,
        testCRDVersionV2Alpha1.name,
        testCRDVersionV3Beta1.name,
        testCRDVersionV1.name,
      ].sort(apiVersionCompare),
    ).toEqual([
      testCRDVersionV8Unserved.name,
      testCRDVersionV1.name,
      testCRDVersionV3Beta1.name,
      testCRDVersionV2Beta1.name,
      testCRDVersionV2Alpha1.name,
      testCRDVersionV1Alpha2.name,
      testCRDVersionV1Alpha1.name,
    ]);
  });

  it('returns a CRDVersion array with some null values in correct sort order', () => {
    expect(
      [
        testCRDVersionV1Alpha1.name,
        testCRDVersionV1Alpha2.name,
        testCRDVersionV8Unserved.name,
        testCRDInvalidVersion.name,
        testCRDVersionV2Beta1.name,
        testCRDVersionV2Alpha1.name,
        testCRDVersionV3Beta1.name,
        testCRDVersionV1.name,
        testCRDInvalidVersionTwo.name,
      ].sort(apiVersionCompare),
    ).toEqual([
      testCRDVersionV8Unserved.name,
      testCRDVersionV1.name,
      testCRDVersionV3Beta1.name,
      testCRDVersionV2Beta1.name,
      testCRDVersionV2Alpha1.name,
      testCRDVersionV1Alpha2.name,
      testCRDVersionV1Alpha1.name,
      testCRDInvalidVersionTwo.name,
      testCRDInvalidVersion.name,
    ]);
  });
});

describe('getLatestVersionForCRD', () => {
  it('returns latest version from array of versions', () => {
    expect(getLatestVersionForCRD(testForValidVersionsCRD)).toEqual(testCRDVersionV1.name);
  });

  it('returns undefined from array of unserved versions', () => {
    expect(getLatestVersionForCRD(testForUnservedVersionsCRD)).toBeUndefined();
  });
});
