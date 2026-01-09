import { compact, uniq } from 'lodash';
import { getURLSearchParams } from '@console/internal/components/utils/link';

const getEnabledDynamicPluginNames = () => {
  const allPluginNames = window.SERVER_FLAGS.consolePlugins;
  const disabledPlugins = getURLSearchParams()['disable-plugins'];

  if (disabledPlugins === '') {
    return [];
  }

  if (!disabledPlugins) {
    return allPluginNames;
  }

  const disabledPluginNames = compact(disabledPlugins.split(','));

  return uniq(allPluginNames).filter((pluginName) => !disabledPluginNames.includes(pluginName));
};

/**
 * List of dynamic plugin names from server flags and URL params to be loaded by Console.
 *
 * Note: this also determines the order of extensions returned from Console plugin SDK hooks
 * like `useExtensions` and `useResolvedExtensions`.
 */
export const dynamicPluginNames = getEnabledDynamicPluginNames();
