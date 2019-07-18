import * as _ from 'lodash';
import { referenceForModel } from '@console/internal/module/k8s';
import {
  getResourceListPages,
  getResourceDetailsPages,
} from '@console/internal/components/resource-pages';
import { isResourceListPage, isResourceDetailsPage } from '@console/plugin-sdk';
import { testedPluginStore, getDuplicates } from '../plugin-test-utils';

describe('ResourceListPage', () => {
  it('only one page per model is allowed', () => {
    const baseModelRefs = getResourceListPages([])
      .keySeq()
      .toArray();
    const pluginModelRefs = _.flatMap(
      testedPluginStore
        .getAllExtensions()
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
    const baseModelRefs = getResourceDetailsPages([])
      .keySeq()
      .toArray();
    const pluginModelRefs = _.flatMap(
      testedPluginStore
        .getAllExtensions()
        .filter(isResourceDetailsPage)
        .map((p) => referenceForModel(p.properties.model)),
    );
    const allModelRefs = baseModelRefs.concat(pluginModelRefs);
    const duplicateModelRefs = getDuplicates(allModelRefs);

    expect(duplicateModelRefs).toEqual([]);
  });
});
