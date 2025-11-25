import { List as ImmutableList } from 'immutable';
import * as _ from 'lodash';
import type { Extension } from '@console/dynamic-plugin-sdk/src/types';
import { loadLocalPluginsForTestPurposes } from '@console/plugin-sdk/src/codegen/local-plugins';
import { resolvePluginPackages } from '@console/plugin-sdk/src/codegen/plugin-resolver';
import { PluginStore } from '@console/plugin-sdk/src/store';

const testedPlugins = loadLocalPluginsForTestPurposes(resolvePluginPackages());
const testedPluginStore = new PluginStore();

testedPlugins.forEach((plugin) => {
  testedPluginStore.loadPlugin(plugin);
});

export const testedExtensions = ImmutableList<Extension>(testedPluginStore.getExtensions());

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
