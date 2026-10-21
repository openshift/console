import type { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
import type { YAMLTemplate } from '@console/dynamic-plugin-sdk/src/extensions/yaml-templates';
import { isYAMLTemplate } from '@console/dynamic-plugin-sdk/src/extensions/yaml-templates';
import { baseTemplates } from '@console/internal/models/yaml-templates';
import type { GroupVersionKind } from '@console/internal/module/k8s';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { renderHookWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

type TemplateEntry = [GroupVersionKind, ImmutableMap<string, string>];

const entryToKeys = (entry: TemplateEntry) => {
  const keys: string[] = [];

  entry[1]
    .keySeq()
    .toArray()
    .forEach((templateName) => {
      keys.push(`${entry[0]}_${templateName}`); // e.g. 'apps~v1~ReplicaSet_default'
    });

  return keys;
};

const extensionToKeys = (e: YAMLTemplate) => {
  return [`${referenceForExtensionModel(e.properties.model)}_${e.properties.name || 'default'}`];
};

const getDuplicates = (arr: string[]) => Object.keys(_.pickBy(_.countBy(arr), (c) => c > 1));

describe('YAMLTemplate', () => {
  it('only one named template per model is allowed', async () => {
    const { result } = await renderHookWithProviders(() => useExtensions(isYAMLTemplate));

    const baseTemplateEntries = _.values(baseTemplates.entrySeq().toObject()) as TemplateEntry[];
    const baseTemplateKeys = _.flatMap(baseTemplateEntries.map(entryToKeys));
    const pluginTemplateKeys = _.flatMap(
      result.current.filter(isYAMLTemplate).map(extensionToKeys),
    );
    const allTemplateKeys = baseTemplateKeys.concat(pluginTemplateKeys);
    const duplicateTemplateKeys = getDuplicates(allTemplateKeys);

    expect(duplicateTemplateKeys).toEqual([]);
  });
});
