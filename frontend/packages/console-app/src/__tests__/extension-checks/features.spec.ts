import * as _ from 'lodash';

import { referenceForModel } from '@console/internal/module/k8s';
import { baseCRDs } from '@console/internal/reducers/features';
import { isModelFeatureFlag } from '@console/plugin-sdk';
import { testedRegistry, getDuplicates } from '../plugin-test-utils';

describe('ModelFeatureFlag', () => {
  it('only one flag per model is allowed', () => {
    const baseModelRefs = _.keys(baseCRDs);
    const pluginModelRefs = _.flatMap(
      testedRegistry
        .getFeatureFlags()
        .filter(isModelFeatureFlag)
        .map((ff) => referenceForModel(ff.properties.model)),
    );
    const allModelRefs = baseModelRefs.concat(pluginModelRefs);
    const duplicateModelRefs = getDuplicates(allModelRefs);

    expect(duplicateModelRefs).toEqual([]);
  });
});
