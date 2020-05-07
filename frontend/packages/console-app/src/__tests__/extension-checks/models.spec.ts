import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import * as staticModels from '@console/internal/models';
import { testedExtensions } from '../plugin-test-utils';
import { isModelDefinition } from '@console/plugin-sdk';

describe('ModelDefinition', () => {
  it('duplicate models are not allowed', () => {
    const baseModels = _.values(staticModels);
    const pluginModels = _.flatMap(
      testedExtensions
        .toArray()
        .filter(isModelDefinition)
        .map((md) => md.properties.models),
    );
    const allModels = baseModels.concat(pluginModels);
    const dedupedModels = _.uniqWith(
      allModels,
      (a, b) => referenceForModel(a) === referenceForModel(b),
    );
    const duplicateModels = _.difference(allModels, dedupedModels);

    expect(duplicateModels).toEqual([]);
  });
});
