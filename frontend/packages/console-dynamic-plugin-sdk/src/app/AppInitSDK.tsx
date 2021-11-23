import * as React from 'react';
import { Provider } from 'react-redux';
import { useReduxStore } from './useReduxStore';

type AppInitSDKProps = {
  children: React.ReactNode;
};

/**
 * Component for providing store access to the SDK.
 * Add this at app-level to make use of app store, preferred to have it under Provider.
 * It checks for store instance if present or not.
 * If the store is there then the reference is persisted to be used in SDK else it creates a new store and passes it to the children with the provider
 * @component AppInitSDK
 * @example
 * ```ts
 * return (
 *  <Provider store={store}>
 *   <AppInitSDK>
 *      <CustomApp />
 *      ...
 *   </AppInitSDK>
 *  </Provider>
 * )
 * ```
 */
const AppInitSDK: React.FC<AppInitSDKProps> = ({ children }) => {
  const { store, storeContextPresent } = useReduxStore();
  return !storeContextPresent ? <Provider store={store}>{children}</Provider> : <>{children}</>;
};

export default AppInitSDK;
