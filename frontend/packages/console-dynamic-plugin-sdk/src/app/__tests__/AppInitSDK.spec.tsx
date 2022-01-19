import * as React from 'react';
import { shallow, mount } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AppInitSDK from '../AppInitSDK';
import * as configSetup from '../configSetup';
import * as hooks from '../useReduxStore';

jest.mock('react-redux', () => {
  const ActualReactRedux = require.requireActual('react-redux');
  return {
    ...ActualReactRedux,
    useStore: jest.fn(),
  };
});

describe('AppInitSDK', () => {
  const mockStore = configureMockStore();
  const store = mockStore([thunk]);
  const mockConfig = {
    apiDiscovery: jest.fn(),
    appFetch: jest.fn(),
  };

  let useReduxStoreSpy;
  let configSetupSpy;
  beforeEach(() => {
    useReduxStoreSpy = jest.spyOn(hooks, 'useReduxStore');
    configSetupSpy = jest.spyOn(configSetup, 'setUtilsConfig');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should not wrap children with Provider', () => {
    useReduxStoreSpy.mockImplementation(() => ({ store, storeContextPresent: true }));
    const wrapper = shallow(
      <AppInitSDK configurations={mockConfig}>
        <div data-test-id="child-id">Hello!!</div>
      </AppInitSDK>,
    );
    expect(wrapper.find(Provider)).toHaveLength(0);
    expect(wrapper.find('[data-test-id="child-id"]')).toHaveLength(1);
  });

  it('should wrap children with Provider', () => {
    useReduxStoreSpy.mockImplementation(() => ({ store, storeContextPresent: false }));
    const wrapper = shallow(
      <AppInitSDK configurations={mockConfig}>
        <div data-test-id="child-id">Hello!!</div>
      </AppInitSDK>,
    );
    expect(wrapper.find(Provider)).toHaveLength(1);
    expect(wrapper.find('[data-test-id="child-id"]')).toHaveLength(1);
  });

  it('should call the hook useReduxStore', () => {
    useReduxStoreSpy.mockImplementation(() => ({ store, storeContextPresent: true }));
    shallow(
      <AppInitSDK configurations={mockConfig}>
        <div data-test-id="child-id">Hello!!</div>
      </AppInitSDK>,
    );
    expect(useReduxStoreSpy).toHaveBeenCalled();
    expect(useReduxStoreSpy).toHaveBeenCalledTimes(1);
  });

  it('should call the util setUtilsConfig with proper config', () => {
    useReduxStoreSpy.mockImplementation(() => ({ store, storeContextPresent: true }));
    mount(
      <AppInitSDK configurations={mockConfig}>
        <div data-test-id="child-id">Hello!!</div>
      </AppInitSDK>,
    );
    expect(configSetupSpy).toHaveBeenCalled();
    expect(configSetupSpy).toHaveBeenCalledTimes(1);
    expect(configSetupSpy).toHaveBeenCalledWith({ appFetch: mockConfig.appFetch });
  });

  it('should call apiDiscovery with store instance', () => {
    useReduxStoreSpy.mockImplementation(() => ({ store, storeContextPresent: true }));
    mount(
      <AppInitSDK configurations={mockConfig}>
        <div data-test-id="child-id">Hello!!</div>
      </AppInitSDK>,
    );
    expect(mockConfig.apiDiscovery).toHaveBeenCalled();
    expect(mockConfig.apiDiscovery).toHaveBeenCalledTimes(1);
    expect(mockConfig.apiDiscovery).toHaveBeenCalledWith(store);
  });
});
