import type { ReactNode, FC } from 'react';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { setUtilsConfig, UtilsConfig } from './configSetup';
import { initApiDiscovery } from './k8s/api-discovery/api-discovery';
import { InitApiDiscovery } from './k8s/api-discovery/api-discovery-types';
import { useReduxStore } from './useReduxStore';

type AppInitSDKProps = {
  children: ReactNode;
  configurations: {
    apiDiscovery?: InitApiDiscovery;
    appFetch: UtilsConfig['appFetch'];
    dynamicPlugins?: () => void;
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
const AppInitSDK: FC<AppInitSDKProps> = ({ children, configurations }) => {
  const { store, storeContextPresent } = useReduxStore();
  useEffect(() => {
    const { appFetch, dynamicPlugins, apiDiscovery = initApiDiscovery } = configurations;
    try {
      setUtilsConfig({ appFetch });
      dynamicPlugins?.();
      apiDiscovery(store);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  }, [configurations, store]);

  return !storeContextPresent ? <Provider store={store}>{children}</Provider> : <>{children}</>;
};

export default AppInitSDK;
