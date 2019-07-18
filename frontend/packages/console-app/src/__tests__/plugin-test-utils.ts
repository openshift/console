import * as _ from 'lodash';
import { ExtensionRegistry } from '@console/plugin-sdk';
import { resolvePluginPackages, loadActivePlugins } from '@console/plugin-sdk/src/codegen';

export const testedPlugins = loadActivePlugins(resolvePluginPackages());
export const testedRegistry = new ExtensionRegistry(testedPlugins);

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
