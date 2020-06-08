import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import { baseListPages, baseDetailsPages } from '@console/internal/components/resource-pages';
import { testedExtensions, getDuplicates } from '../plugin-test-utils';
import { isResourceListPage, isResourceDetailsPage } from '@console/plugin-sdk';

describe('ResourceListPage', () => {
  it('only one page per model is allowed', () => {
    const baseModelRefs = baseListPages.keySeq().toArray();
    const pluginModelRefs = _.flatMap(
      testedExtensions
        .toArray()
        .filter(isResourceListPage)
        .map((p) => referenceForModel(p.properties.model)),
    );
    const allModelRefs = baseModelRefs.concat(pluginModelRefs);
    const duplicateModelRefs = getDuplicates(allModelRefs);

    expect(duplicateModelRefs).toEqual([]);
  });
});

describe('ResourceDetailsPage', () => {
  it('only one page per model is allowed', () => {
    const baseModelRefs = baseDetailsPages.keySeq().toArray();
    const pluginModelRefs = _.flatMap(
      testedExtensions
        .toArray()
        .filter(isResourceDetailsPage)
        .map((p) => referenceForModel(p.properties.model)),
    );
    const allModelRefs = baseModelRefs.concat(pluginModelRefs);
    const duplicateModelRefs = getDuplicates(allModelRefs);

    expect(duplicateModelRefs).toEqual([]);
  });
});
