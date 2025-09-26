import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as reactRedux from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AppInitSDK from '../AppInitSDK';
import * as configSetup from '../configSetup';
import * as apiDiscovery from '../k8s/api-discovery/api-discovery';
import * as hooks from '../useReduxStore';

// Mock the dependencies for testing.
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
const ChildComponent = () => <div>Hello, OpenShift!</div>;
const mockConfig = { appFetch: jest.fn() };
const mockApiDiscoveryConfig = { apiDiscovery: jest.fn(), appFetch: jest.fn() };

describe('AppInitSDK', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not wrap children with Provider', () => {
    useReduxStoreMock.mockReturnValue({ store, storeContextPresent: true });

    render(
      <AppInitSDK configurations={mockConfig}>
        <ChildComponent />
      </AppInitSDK>,
    );

    expect(mockProvider).not.toHaveBeenCalled();
    expect(screen.getByText('Hello, OpenShift!')).toBeVisible();
  });

  it('should wrap children with a Provider if no store context is present', () => {
    useReduxStoreMock.mockReturnValue({ store, storeContextPresent: false });

    render(
      <AppInitSDK configurations={mockConfig}>
        <ChildComponent />
      </AppInitSDK>,
    );

    expect(mockProvider).toHaveBeenCalled();
    expect(screen.getByText('Hello, OpenShift!')).toBeVisible();
  });

  it('should call the useReduxStore hook', () => {
    useReduxStoreMock.mockReturnValue({ store, storeContextPresent: true });

    render(
      <AppInitSDK configurations={mockConfig}>
        <ChildComponent />
      </AppInitSDK>,
    );

    expect(useReduxStoreMock).toHaveBeenCalledTimes(1);
  });

  it('should call the setUtilsConfig utility with the proper config', () => {
    useReduxStoreMock.mockReturnValue({ store, storeContextPresent: true });

    render(
      <AppInitSDK configurations={mockConfig}>
        <ChildComponent />
      </AppInitSDK>,
    );

    expect(configSetup.setUtilsConfig).toHaveBeenCalledTimes(1);
    expect(configSetup.setUtilsConfig).toHaveBeenCalledWith({ appFetch: mockConfig.appFetch });
  });

  it('should call the provided apiDiscovery function if it exists', () => {
    useReduxStoreMock.mockReturnValue({ store, storeContextPresent: true });

    render(
      <AppInitSDK configurations={mockApiDiscoveryConfig}>
        <ChildComponent />
      </AppInitSDK>,
    );

    // The provided function should be called.
    expect(mockApiDiscoveryConfig.apiDiscovery).toHaveBeenCalledTimes(1);
    expect(mockApiDiscoveryConfig.apiDiscovery).toHaveBeenCalledWith(store);
    // The default function should NOT be called.
    expect(apiDiscovery.initApiDiscovery).not.toHaveBeenCalled();
  });

  it('should trigger the default initApiDiscovery if no apiDiscovery function is provided', () => {
    useReduxStoreMock.mockReturnValue({ store, storeContextPresent: false });

    render(
      <AppInitSDK configurations={mockConfig}>
        <ChildComponent />
      </AppInitSDK>,
    );

    expect(apiDiscovery.initApiDiscovery).toHaveBeenCalledTimes(1);
    expect(apiDiscovery.initApiDiscovery).toHaveBeenCalledWith(store);
  });
});
