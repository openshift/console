import * as _ from 'lodash';
import type { YAMLTemplate } from '@console/dynamic-plugin-sdk/src/extensions/yaml-templates';
import { isYAMLTemplate } from '@console/dynamic-plugin-sdk/src/extensions/yaml-templates';
import { baseTemplates } from '@console/internal/models/yaml-templates';
import type { GroupVersionKind } from '@console/internal/module/k8s';
import { referenceForExtensionModel } from '@console/internal/module/k8s';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { renderHookWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

type TemplateEntry = [GroupVersionKind, Record<string, string>];

// e.g. 'apps~v1~ReplicaSet_default'
const entryToKeys = (entry: TemplateEntry) =>
  Object.keys(entry[1]).map((templateName) => `${entry[0]}_${templateName}`);

const extensionToKeys = (e: YAMLTemplate) => [
  `${referenceForExtensionModel(e.properties.model)}_${e.properties.name || 'default'}`,
];

const getDuplicates = (arr: string[]) => Object.keys(_.pickBy(_.countBy(arr), (c) => c > 1));

describe('YAMLTemplate', () => {
  it('only one named template per model is allowed', async () => {
    const { result } = await renderHookWithProviders(() => useExtensions(isYAMLTemplate));

    const baseTemplateEntries = Object.entries(baseTemplates) as TemplateEntry[];
    const baseTemplateKeys = _.flatMap(baseTemplateEntries.map(entryToKeys));
    const pluginTemplateKeys = _.flatMap(
      result.current.filter(isYAMLTemplate).map(extensionToKeys),
    );
    const allTemplateKeys = baseTemplateKeys.concat(pluginTemplateKeys);
    const duplicateTemplateKeys = getDuplicates(allTemplateKeys);

    expect(duplicateTemplateKeys).toEqual([]);
  });
});
