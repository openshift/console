import * as React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import AppInitSDK from '../AppInitSDK';
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

  it('should not wrap children with Provider', () => {
    jest
      .spyOn(hooks, 'useReduxStore')
      .mockImplementation(() => ({ store, storeContextPresent: true }));
    const wrapper = shallow(
      <AppInitSDK>
        <div data-test-id="child-id">Hello!!</div>
      </AppInitSDK>,
    );
    expect(wrapper.find(Provider)).toHaveLength(0);
    expect(wrapper.find('[data-test-id="child-id"]')).toHaveLength(1);
  });

  it('should wrap children with Provider', () => {
    jest
      .spyOn(hooks, 'useReduxStore')
      .mockImplementation(() => ({ store, storeContextPresent: false }));
  });
  const wrapper = shallow(
    <AppInitSDK>
      <div data-test-id="child-id">Hello!!</div>
    </AppInitSDK>,
  );
  expect(wrapper.find(Provider)).toHaveLength(1);
  expect(wrapper.find('[data-test-id="child-id"]')).toHaveLength(1);
});
