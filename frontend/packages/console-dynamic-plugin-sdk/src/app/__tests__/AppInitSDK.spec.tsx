import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as reactRedux from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AppInitSDK from '../AppInitSDK';
import * as configSetup from '../configSetup';
import * as apiDiscovery from '../k8s/api-discovery/api-discovery';
import * as hooks from '../useReduxStore';

jest.mock('react-redux', () => ({
  Provider: jest.fn(({ children }) => children),
}));

jest.mock('../useReduxStore', () => ({
  useReduxStore: jest.fn(),
}));

jest.mock('../configSetup', () => ({
  setUtilsConfig: jest.fn(),
}));

jest.mock('../k8s/api-discovery/api-discovery', () => ({
  initApiDiscovery: jest.fn(),
}));

const { useReduxStore: useReduxStoreMock } = hooks as jest.Mocked<typeof hooks>;
const mockStore = configureMockStore([thunk]);
const store = mockStore({});
const mockProvider = (reactRedux as jest.Mocked<typeof reactRedux>).Provider;
const mockConfig = { appFetch: jest.fn() };
const mockApiDiscoveryConfig = { apiDiscovery: jest.fn(), appFetch: jest.fn() };

describe('AppInitSDK', () => {
  const renderAppInitSDK = (config, storeContext = { store, storeContextPresent: true }) => {
    useReduxStoreMock.mockReturnValue(storeContext);
    return render(
      <AppInitSDK configurations={config}>
        <div>Hello, OpenShift!</div>
      </AppInitSDK>,
    );
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not wrap children with Provider', () => {
    renderAppInitSDK(mockConfig, { store, storeContextPresent: true });

    expect(mockProvider).not.toHaveBeenCalled();
    expect(screen.getByText('Hello, OpenShift!')).toBeVisible();
  });

  it('should wrap children with a Provider if no store context is present', () => {
    renderAppInitSDK(mockConfig, { store, storeContextPresent: false });

    expect(mockProvider).toHaveBeenCalled();
    expect(screen.getByText('Hello, OpenShift!')).toBeVisible();
  });

  it('should call the useReduxStore hook', () => {
    renderAppInitSDK(mockConfig, { store, storeContextPresent: true });

    expect(useReduxStoreMock).toHaveBeenCalledTimes(1);
  });

  it('should call the setUtilsConfig utility with the proper config', () => {
    renderAppInitSDK(mockConfig, { store, storeContextPresent: true });

    expect(configSetup.setUtilsConfig).toHaveBeenCalledTimes(1);
    expect(configSetup.setUtilsConfig).toHaveBeenCalledWith({ appFetch: mockConfig.appFetch });
  });

  it('should call the provided apiDiscovery function if it exists', () => {
    renderAppInitSDK(mockApiDiscoveryConfig, { store, storeContextPresent: true });

    expect(mockApiDiscoveryConfig.apiDiscovery).toHaveBeenCalledTimes(1);
    expect(mockApiDiscoveryConfig.apiDiscovery).toHaveBeenCalledWith(store);
    expect(apiDiscovery.initApiDiscovery).not.toHaveBeenCalled();
  });

  it('should trigger the default initApiDiscovery if no apiDiscovery function is provided', () => {
    renderAppInitSDK(mockConfig, { store, storeContextPresent: false });

    expect(apiDiscovery.initApiDiscovery).toHaveBeenCalledTimes(1);
    expect(apiDiscovery.initApiDiscovery).toHaveBeenCalledWith(store);
  });
});
