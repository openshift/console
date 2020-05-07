import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import { baseCRDs } from '@console/internal/reducers/features';
import { FLAGS } from '@console/shared/src/constants/common';
import { testedExtensions, getDuplicates } from '../plugin-test-utils';
import { isModelFeatureFlag } from '@console/plugin-sdk';

describe('ModelFeatureFlag', () => {
  it('duplicate flags are not allowed', () => {
    const baseFlags: string[] = Object.values(FLAGS).filter((f) => typeof f === 'string');
    const pluginFlags = testedExtensions
      .toArray()
      .filter(isModelFeatureFlag)
      .map((ff) => ff.properties.flag);
    const allFlags = baseFlags.concat(pluginFlags);
    const duplicateFlags = getDuplicates(allFlags);

    expect(duplicateFlags).toEqual([]);
  });

  it('only one flag per model is allowed', () => {
    const baseModelRefs = _.keys(baseCRDs);
    const pluginModelRefs = _.flatMap(
      testedExtensions
        .toArray()
        .filter(isModelFeatureFlag)
        .map((ff) => referenceForModel(ff.properties.model)),
    );
    const allModelRefs = baseModelRefs.concat(pluginModelRefs);
    const duplicateModelRefs = getDuplicates(allModelRefs);

    expect(duplicateModelRefs).toEqual([]);
  });
});
