import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { TopologyDataControllerProps, TopologyDataController } from '../TopologyDataController';
import { TopologyExtensionLoader } from '../TopologyExtensionLoader';

const TestInner = () => null;

jest.mock('@console/plugin-sdk/src/useExtensions', () => ({
  useExtensions: () => [],
}));

describe('TopologyDataController', () => {
  let wrapper: ReactWrapper<TopologyDataControllerProps>;

  beforeEach(() => {
    wrapper = mount(
      <TopologyDataController
        namespace="test-project"
        kindsInFlight={false}
        render={() => <TestInner />}
      />,
      {
        wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );
  });

  it('should render inner component', () => {
    expect(wrapper.find(TopologyExtensionLoader)).toHaveLength(1);
  });
});
