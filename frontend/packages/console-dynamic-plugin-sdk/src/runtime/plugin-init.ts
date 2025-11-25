import * as _ from 'lodash';
import { Store } from 'redux';
import {
  initSharedScope,
  getSharedScope,
} from '@console/dynamic-plugin-sdk/src/runtime/plugin-shared-modules';
import { RootState } from '@console/internal/redux';
import { initSubscriptionService } from '@console/plugin-sdk/src/api/pluginSubscriptionService';
import { PluginStore } from '@console/plugin-sdk/src/store';
import { registerPluginEntryCallback, loadAndEnablePlugin } from './plugin-loader';

export const initConsolePlugins = _.once(
  (pluginStore: PluginStore, reduxStore: Store<RootState>) => {
    // Initialize dynamic plugin infrastructure
    initSubscriptionService(pluginStore, reduxStore);
    registerPluginEntryCallback(pluginStore);

    // Initialize webpack share scope object and start loading plugins
    initSharedScope()
      .then(() => {
        pluginStore.getAllowedDynamicPluginNames().forEach((pluginName) => {
          loadAndEnablePlugin(pluginName, pluginStore, (errorMessage, errorCause) => {
            // eslint-disable-next-line no-console
            console.error(..._.compact([errorMessage, errorCause]));
          });
        });

        if (process.env.NODE_ENV !== 'production') {
          // Expose webpack share scope object for debugging
          window.webpackSharedScope = getSharedScope();
        }
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize webpack share scope for dynamic plugins', err);
      });
  },
);
