/* eslint-disable no-undef, no-unused-vars */

import { modelFor, modelKeyFor, allModels } from '../../../public/module/k8s/k8s-models';
import { K8sResourceKindReference } from '../../../public/module/k8s';

describe('modelFor', () => {
  let ref: K8sResourceKindReference;

  it('returns k8s model for string reference', () => {
    ref = 'Pod';

    expect(modelFor(ref)).toBeDefined();
  });

  it('returns k8s model for fully qualified reference', () => {
    ref = {
      kind: 'AlphaCatalogEntry-v1',
      group: 'app.coreos.com',
      version: 'v1alpha1',
    };

    expect(modelFor(ref)).toBeDefined();
  });
});

describe('modelKeyFor', () => {
  let ref: K8sResourceKindReference;

  it('returns given string reference', () => {
    ref = 'Pod';

    expect(modelKeyFor(ref)).toEqual(ref);
  });

  it('returns unique string key if given fully qualified reference', () => {
    ref = {
      kind: 'AlphaCatalogEntry-v1',
      group: 'app.coreos.com',
      version: 'v1alpha1',
    };

    expect(modelKeyFor(ref)).toEqual(`${ref.kind}:${ref.group}:${ref.version}`);
  });
});

describe('allModels', () => {

  it('returns immutable map of all models', () => {
    expect(allModels().count()).toEqual(41);
  });
});
