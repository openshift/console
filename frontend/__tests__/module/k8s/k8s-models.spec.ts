/* eslint-disable no-undef, no-unused-vars */

import { modelFor, allModels } from '../../../public/module/k8s/k8s-models';
import { K8sResourceKindReference, kindForReference } from '../../../public/module/k8s';

describe('modelFor', () => {
  let ref: K8sResourceKindReference;

  it('returns k8s model for string reference', () => {
    ref = 'Pod';

    expect(modelFor(ref)).toBeDefined();
  });

  it('returns k8s model for fully qualified reference', () => {
    ref = 'UICatalogEntry-v1:app.coreos.com:v1alpha1';

    expect(modelFor(ref)).toBeDefined();
  });
});

describe('kindForReference', () => {
  let ref: K8sResourceKindReference;

  it('returns given string reference', () => {
    ref = 'Pod';

    expect(kindForReference(ref)).toEqual(ref);
  });

  it('returns `kind` string if given fully qualified reference', () => {
    ref = 'UICatalogEntry-v1:app.coreos.com:v1alpha1';

    expect(kindForReference(ref)).toEqual('UICatalogEntry-v1');
  });
});

describe('allModels', () => {

  it('returns immutable map of all models', () => {
    expect(allModels().count()).toEqual(42);
  });
});
