import * as _ from 'lodash';
import { Store } from 'redux';
import { RootState } from '@console/internal/redux';
import { initSubscriptionService } from '@console/plugin-sdk/src/api/pluginSubscriptionService';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { exposePluginAPI } from './plugin-api';
import { registerPluginEntryCallback, loadAndEnablePlugin } from './plugin-loader';

export const initConsolePlugins = _.once(
  (pluginStore: PluginStore, reduxStore: Store<RootState>) => {
    initSubscriptionService(pluginStore, reduxStore);
    registerPluginEntryCallback(pluginStore);
    exposePluginAPI();

    // Load all dynamic plugins which are currently enabled on the cluster
    window.SERVER_FLAGS.consolePlugins.forEach((pluginName) => {
      loadAndEnablePlugin(pluginName, pluginStore, () => {
        // TODO(vojtech): add new entry into the notification drawer
        pluginStore.registerFailedDynamicPlugin(pluginName);
      });
    });
  },
);
