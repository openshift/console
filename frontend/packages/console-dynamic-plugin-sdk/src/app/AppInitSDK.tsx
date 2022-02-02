import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { setUtilsConfig, UtilsConfig } from './configSetup';
import { initApiDiscovery } from './k8s/api-discovery/api-discovery';
import { InitApiDiscovery } from './k8s/api-discovery/api-discovery-types';
import { useReduxStore } from './useReduxStore';

type AppInitSDKProps = {
  children: React.ReactNode;
  configurations: {
    apiDiscovery?: InitApiDiscovery;
    appFetch: UtilsConfig['appFetch'];
    /** @deprecated - will be removed later when we have an interface for plugin */
    initPlugins?: (store: Store<any>) => void;
  };
};

/**
 * Component for providing store access to the SDK.
 * Add this at app-level to make use of app's redux store and pass configurations prop needed to initialize the app, preferred to have it under Provider.
 * It checks for store instance if present or not.
 * If the store is there then the reference is persisted to be used in SDK else it creates a new store and passes it to the children with the provider
 * @component AppInitSDK
 * @example
 * ```ts
 * return (
 *  <Provider store={store}>
 *   <AppInitSDK configurations={{ appFetch, apiDiscovery }}>
 *      <CustomApp />
 *      ...
 *   </AppInitSDK>
 *  </Provider>
 * )
 * ```
 */
const AppInitSDK: React.FC<AppInitSDKProps> = ({ children, configurations }) => {
  const { store, storeContextPresent } = useReduxStore();
  React.useEffect(() => {
    const { appFetch, initPlugins, apiDiscovery = initApiDiscovery } = configurations;
    try {
      setUtilsConfig({ appFetch });
      if (initPlugins) {
        initPlugins(store);
      }
      apiDiscovery(store);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  }, [configurations, store]);

  return !storeContextPresent ? <Provider store={store}>{children}</Provider> : <>{children}</>;
};

export default AppInitSDK;
