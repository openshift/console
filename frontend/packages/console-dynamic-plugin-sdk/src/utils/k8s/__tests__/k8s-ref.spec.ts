import { DeploymentModel, PodModel } from '../__mocks__/k8s-data';
import {
  getAPIVersionForModel,
  getGroupVersionKindForReference,
  getGroupVersionKindForResource,
  getReference,
  getReferenceForModel,
  transformGroupVersionKindToReference,
  getGroupVersionKindForModel,
} from '../k8s-ref';

describe('k8s-Resource', () => {
  it('should return reference for provided group, version, and kind', () => {
    const referenceData = getReference({ group: 'apps', version: 'v1', kind: 'Deployment' });
    expect(referenceData).toEqual('apps~v1~Deployment');
  });

  it('should return reference for provided version and kind', () => {
    const referenceData = getReference({ group: null, version: 'v1', kind: 'Pod' });
    expect(referenceData).toEqual('core~v1~Pod');
  });

  it('should return reference for provided model', () => {
    const referenceData = getReferenceForModel(DeploymentModel);
    expect(referenceData).toEqual('apps~v1~Deployment');
  });

  it('should return apiVersion for provided model', () => {
    const apiVersion = getAPIVersionForModel(DeploymentModel);
    expect(apiVersion).toEqual('apps/v1');
  });

  it('should return apiVersion for provided model if apiGroup is not present', () => {
    const apiVersion = getAPIVersionForModel(PodModel);
    expect(apiVersion).toEqual('v1');
  });

  it('should return Group, Version, and Kind for provided reference', () => {
    const { group, version, kind } = getGroupVersionKindForReference('apps~v1~Deployment');
    expect(group).toEqual('apps');
    expect(version).toEqual('v1');
    expect(kind).toEqual('Deployment');
  });

  it('should throw Error for invalid reference', () => {
    expect(() => getGroupVersionKindForReference('apps~v1~beta1~Deployment')).toThrow(
      'Provided reference is invalid.',
    );
  });

  it('should return Group, Version, and Kind for provided resource', () => {
    const { group, version, kind } = getGroupVersionKindForResource({
      apiVersion: 'apps/v1',
      kind: 'Deployment',
    });
    expect(group).toEqual('apps');
    expect(version).toEqual('v1');
    expect(kind).toEqual('Deployment');
  });

  it('should return Group, Version, and Kind for provided resource which does not have group in apiVersion', () => {
    const { group, version, kind } = getGroupVersionKindForResource({
      apiVersion: 'v1',
      kind: 'Pod',
    });
    expect(group).toBeUndefined();
    expect(version).toEqual('v1');
    expect(kind).toEqual('Pod');
  });

  it('should throw Error for provided resource if apiVersion is invalid', () => {
    expect(() =>
      getGroupVersionKindForResource({
        apiVersion: 'apps/v1/beta1',
        kind: 'Dummy',
      }),
    ).toThrow('Provided resource has invalid apiVersion.');
  });

  it('should return Group, Version, and Kind for provided model', () => {
    const { group, version, kind } = getGroupVersionKindForModel(DeploymentModel);
    expect(group).toEqual('apps');
    expect(version).toEqual('v1');
    expect(kind).toEqual('Deployment');
  });

  it('should return Group, Version, and Kind for provided model which does not have apiGroup', () => {
    const { group, version, kind } = getGroupVersionKindForModel(PodModel);
    expect(group).toBeUndefined();
    expect(version).toEqual('v1');
    expect(kind).toEqual('Pod');
  });

  it('should return reference for provided group, version, and kind', () => {
    const referenceData = transformGroupVersionKindToReference({
      group: 'apps',
      version: 'v1',
      kind: 'Deployment',
    });
    expect(referenceData).toEqual('apps~v1~Deployment');
  });

  it('should return reference for provided reference', () => {
    const referenceData = transformGroupVersionKindToReference('apps~v1~Deployment');
    expect(referenceData).toEqual('apps~v1~Deployment');
  });
});
