import { PluginStore } from '@openshift/dynamic-plugin-sdk';
import { List as ImmutableList } from 'immutable';
import * as _ from 'lodash';
import type { Extension } from '@console/dynamic-plugin-sdk/src/types';
import { loadLocalPluginsForTestPurposes } from '@console/plugin-sdk/src/codegen/local-plugins';
import { resolvePluginPackages } from '@console/plugin-sdk/src/codegen/plugin-resolver';

const testedPlugins = loadLocalPluginsForTestPurposes(resolvePluginPackages());
const testedPluginStore = new PluginStore();

const testedPluginsLoaded = Promise.all(
  testedPlugins.map((plugin) => testedPluginStore.loadPlugin(plugin)),
);

export const getTestedExtensions = async () => {
  await testedPluginsLoaded;
  return ImmutableList<Extension>(testedPluginStore.getExtensions());
};

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
