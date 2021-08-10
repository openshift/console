import * as _ from 'lodash';

/** TODO: Copied right now -- duplicate definition */
const getURLSearchParams = () => {
  const all: any = {};
  const params = new URLSearchParams(window.location.search);

  for (const [k, v] of params.entries()) {
    all[k] = v;
  }

  return all;
};

export const getEnabledDynamicPluginNames = () => {
  const allPluginNames = window.SERVER_FLAGS.consolePlugins;
  const disabledPlugins = getURLSearchParams()['disable-plugins'];

  if (!disabledPlugins) {
    return allPluginNames;
  }

  if (disabledPlugins === '') {
    return [];
  }

  const disabledPluginNames = _.compact(disabledPlugins.split(','));
  return allPluginNames.filter((pluginName) => !disabledPluginNames.includes(pluginName));
};
