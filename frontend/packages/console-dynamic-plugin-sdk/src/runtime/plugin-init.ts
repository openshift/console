import * as _ from 'lodash';
import { Store } from 'redux';
import { initSubscriptionService } from '@console/plugin-sdk/src/api/pluginSubscriptionService';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { registerPluginEntryCallback, loadAndEnablePlugin } from './plugin-loader';

export const initConsolePlugins = _.once((pluginStore: PluginStore, reduxStore: Store<any>) => {
  initSubscriptionService(pluginStore, reduxStore);
  registerPluginEntryCallback(pluginStore);

  pluginStore.getAllowedDynamicPluginNames().forEach((pluginName) => {
    loadAndEnablePlugin(pluginName, pluginStore, () => {
      // TODO(vojtech): add new entry into the notification drawer
      pluginStore.registerFailedDynamicPlugin(pluginName);
    });
  });
});
