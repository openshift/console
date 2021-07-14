import * as _ from 'lodash-es';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { ActivePlugin } from '@console/plugin-sdk/src/typings';
import { getURLSearchParams } from './components/utils/link';

const getEnabledDynamicPluginNames = () => {
  const allPluginNames = window.SERVER_FLAGS.consolePlugins;
  const disabledPlugins = getURLSearchParams()['disable-plugins'];

  if (disabledPlugins === '') {
    return [];
  } else if (!disabledPlugins) {
    return allPluginNames;
  }

  const disabledPluginNames = _.compact(disabledPlugins.split(','));
  return allPluginNames.filter((pluginName) => !disabledPluginNames.includes(pluginName));
};

// The '@console/active-plugins' module is generated during a webpack build,
// so we use dynamic require() instead of the usual static import statement.
const activePlugins =
  process.env.NODE_ENV !== 'test'
    ? (require('@console/active-plugins').default as ActivePlugin[])
    : [];

const dynamicPluginNames = getEnabledDynamicPluginNames();

export const pluginStore = new PluginStore(activePlugins, dynamicPluginNames);

if (process.env.NODE_ENV !== 'production') {
  // Expose Console plugin store for debugging
  window.pluginStore = pluginStore;
}

if (process.env.NODE_ENV !== 'test') {
  // eslint-disable-next-line no-console
  console.info(`Static plugins: [${activePlugins.map((p) => p.name).join(', ')}]`);
  // eslint-disable-next-line no-console
  console.info(`Dynamic plugins: [${dynamicPluginNames.join(', ')}]`);
}
