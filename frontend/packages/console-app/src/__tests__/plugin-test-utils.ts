import * as _ from 'lodash';
import { List as ImmutableList } from 'immutable';
import { Extension, PluginStore } from '@console/plugin-sdk';
import { resolvePluginPackages, loadActivePlugins } from '@console/plugin-sdk/src/codegen';

const testedPlugins = loadActivePlugins(resolvePluginPackages());
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
