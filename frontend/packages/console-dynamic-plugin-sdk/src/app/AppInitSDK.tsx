import * as React from 'react';
import { Provider } from 'react-redux';
import { Store } from 'redux';
import { ResourceFetch, setUtilsConfig } from './configSetup';
import { useReduxStore } from './useReduxStore';

type AppInitSDKProps = {
  children: React.ReactNode;
  configurations: {
    apiDiscovery: (store: Store<any>) => void;
    appFetch: ResourceFetch;
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
 *   <AppInitSDK configurations={appFetch, apiDiscovery}>
 *      <CustomApp />
 *      ...
 *   </AppInitSDK>
 *  </Provider>
 * )
 * ```
 */
const AppInitSDK: React.FC<AppInitSDKProps> = ({ children, configurations }) => {
  const { store, storeContextPresent } = useReduxStore();
  const { appFetch, apiDiscovery } = configurations;

  React.useEffect(() => {
    apiDiscovery(store);
    try {
      setUtilsConfig({ appFetch });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn(e);
    }
  }, [apiDiscovery, appFetch, configurations, store]);

  return !storeContextPresent ? <Provider store={store}>{children}</Provider> : <>{children}</>;
};

export default AppInitSDK;
