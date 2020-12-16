import { omit } from 'lodash';
import { taskTestData } from '../../../test/pipeline-data';
import { getTaskParameters, getTaskResources } from '../resource-utils';

describe('getTaskResources gets back valid structures', () => {
  it('expect always to get a non-null value', () => {
    expect(getTaskResources(null)).toEqual({});

    const alphaTask = omit(taskTestData.v1alpha1.buildah, [
      'spec.inputs.resources',
      'spec.outputs.resources',
    ]);
    expect(getTaskResources(alphaTask)).toEqual({ inputs: undefined, outputs: undefined });

    const betaTask = omit(taskTestData.v1beta1.buildah, 'spec.resources');
    expect(getTaskResources(betaTask)).toEqual({});
  });

  it('expect to walk a v1alpha1 Task to the appropriate resources', () => {
    const resources = getTaskResources(taskTestData.v1alpha1.buildah);

    expect(resources.inputs).toBeDefined();
    expect(resources.inputs).toHaveLength(1);
    expect(resources.outputs).toBeDefined();
    expect(resources.outputs).toHaveLength(1);
  });

  it('expect to walk a v1beta1 Task to get the appropriate resources', () => {
    const resources = getTaskResources(taskTestData.v1beta1.buildah);

    expect(resources.inputs).toBeDefined();
    expect(resources.inputs).toHaveLength(1);
    expect(resources.outputs).toBeDefined();
    expect(resources.outputs).toHaveLength(1);
  });
});

describe('getTaskParameters gets back valid structures', () => {
  it('expect always to get a non-null value', () => {
    expect(getTaskParameters(null)).toEqual([]);

    const alphaTask = omit(taskTestData.v1alpha1.buildah, 'spec.inputs.params');
    expect(getTaskParameters(alphaTask)).toEqual([]);

    const betaTask = omit(taskTestData.v1beta1.buildah, 'spec.params');
    expect(getTaskParameters(betaTask)).toEqual([]);
  });

  it('expect to walk a v1alpha1 Task to get the parameters associated', () => {
    const parameters = getTaskParameters(taskTestData.v1alpha1.buildah);

    expect(parameters).toHaveLength(2);
  });

  it('expect to walk a v1beta1 Task to get the parameters associated', () => {
    const parameters = getTaskParameters(taskTestData.v1beta1.buildah);

    expect(parameters).toHaveLength(2);
  });
});
