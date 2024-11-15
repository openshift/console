import { PluginStore } from '../store';
import { getPluginStore } from './pluginSubscriptionService';

/**
 * React hook for providing access to the `PluginStore`.
 *
 * Since we don't pass the `PluginStore` to React components via React Context
 * provider, this hook is just a shortcut for the {@link getPluginStore} function.
 *
 * @returns Console `PluginStore` instance.
 */
export const usePluginStore = (): PluginStore => {
  return getPluginStore();
};
