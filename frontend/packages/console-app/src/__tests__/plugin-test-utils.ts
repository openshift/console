import { List as ImmutableList } from 'immutable';
import * as _ from 'lodash';
import type { ExtensionDeclaration } from '@console/dynamic-plugin-sdk/src/types';
import { loadActivePluginsForTestPurposes } from '@console/plugin-sdk/src/codegen/active-plugins';
import { resolvePluginPackages } from '@console/plugin-sdk/src/codegen/plugin-resolver';
import { PluginStore } from '@console/plugin-sdk/src/store';

const testedPlugins = loadActivePluginsForTestPurposes(resolvePluginPackages());
const testedPluginStore = new PluginStore(testedPlugins);

export const testedExtensions = ImmutableList<ExtensionDeclaration>(
  testedPluginStore.getExtensions(),
);

export const getDuplicates = (values: string[]) => {
  return _.transform(
    _.countBy(values),
    (result, valueCount, value) => {
      if (valueCount > 1) {
        result.push(value);
      }
    },
    [] as string[],
  );
};
