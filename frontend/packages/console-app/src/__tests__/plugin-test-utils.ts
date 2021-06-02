import { List as ImmutableList } from 'immutable';
import * as _ from 'lodash';
import { Extension, PluginStore } from '@console/plugin-sdk';
import { loadActivePluginsForTestPurposes } from '@console/plugin-sdk/src/codegen/active-plugins';
import { resolvePluginPackages } from '@console/plugin-sdk/src/codegen/plugin-resolver';

const testedPlugins = loadActivePluginsForTestPurposes(resolvePluginPackages());
const testedPluginStore = new PluginStore(testedPlugins);

export const testedExtensions = ImmutableList<Extension>(testedPluginStore.getAllExtensions());

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
