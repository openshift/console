import * as _ from 'lodash';
import { Store } from 'redux';
import { RootState } from '@console/internal/redux';
import { initSubscriptionService } from '@console/plugin-sdk/src/api/pluginSubscriptionService';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { setPluginStore } from '../utils/k8s';
import { registerPluginEntryCallback, loadAndEnablePlugin } from './plugin-loader';

export const initConsolePlugins = _.once(
  (pluginStore: PluginStore, reduxStore: Store<RootState>) => {
    // Initialize dynamic plugin infrastructure
    initSubscriptionService(pluginStore, reduxStore);
    registerPluginEntryCallback(pluginStore);
    setPluginStore(pluginStore);

    // Load dynamic plugins
    pluginStore.getAllowedDynamicPluginNames().forEach((pluginName) => {
      loadAndEnablePlugin(pluginName, pluginStore, (errorMessage, errorCause) => {
        // eslint-disable-next-line no-console
        console.error(..._.compact([errorMessage, errorCause]));
        pluginStore.registerFailedDynamicPlugin(pluginName, errorMessage, errorCause);
        // TODO(vojtech): add new entry into the notification drawer
      });
    });
  },
);
