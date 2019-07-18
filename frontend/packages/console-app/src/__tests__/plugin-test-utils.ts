import * as _ from 'lodash';
import { PluginStore } from '@console/plugin-sdk';
import { resolvePluginPackages, loadActivePlugins } from '@console/plugin-sdk/src/codegen';

export const testedPluginStore = new PluginStore(loadActivePlugins(resolvePluginPackages()));

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
