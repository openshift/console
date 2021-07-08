import { Map as ImmutableMap } from 'immutable';
import * as _ from 'lodash';
import {
  YAMLTemplate,
  isYAMLTemplate,
} from '@console/dynamic-plugin-sdk/src/extensions/yaml-templates';
import { baseTemplates } from '@console/internal/models/yaml-templates';
import { referenceForExtensionModel, GroupVersionKind } from '@console/internal/module/k8s';
import { testedExtensions, getDuplicates } from '../plugin-test-utils';

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

describe('YAMLTemplate', () => {
  it('only one named template per model is allowed', () => {
    const baseTemplateEntries = _.values(baseTemplates.entrySeq().toObject()) as TemplateEntry[];
    const baseTemplateKeys = _.flatMap(baseTemplateEntries.map(entryToKeys));
    const pluginTemplateKeys = _.flatMap(
      testedExtensions
        .toArray()
        .filter(isYAMLTemplate)
        .map(extensionToKeys),
    );
    const allTemplateKeys = baseTemplateKeys.concat(pluginTemplateKeys);
    const duplicateTemplateKeys = getDuplicates(allTemplateKeys);

    expect(duplicateTemplateKeys).toEqual([]);
  });
});
