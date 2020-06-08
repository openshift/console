import * as React from 'react';
import { mount, ReactWrapper } from 'enzyme';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { TopologyDataControllerProps, TopologyDataController } from '../TopologyDataController';

const TestInner = () => null;
const testProjectMatch = { url: '', params: { name: 'namespace' }, isExact: true, path: '' };

describe('TopologyDataController', () => {
  let wrapper: ReactWrapper<TopologyDataControllerProps>;

  beforeEach(() => {
    wrapper = mount(
      <TopologyDataController
        match={testProjectMatch}
        serviceBinding={false}
        render={() => <TestInner />}
      />,
      {
        wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );
  });

  it('should render inner component', () => {
    // TODO: Find a way to actually test this component, following line will ALWAYS return true (should test for length or existence)
    expect(wrapper.find(<TestInner />)).toBeTruthy();
  });
});
