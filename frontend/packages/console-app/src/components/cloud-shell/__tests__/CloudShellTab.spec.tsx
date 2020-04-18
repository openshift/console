import * as React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import CloudShellTab from '../CloudShellTab';
import CloudShellTerminal from '../CloudShellTerminal';

describe('CloudShell Tab Test', () => {
  it('should render cloudshellterminal', () => {
    const cloudShellTabWrapper = mount(<CloudShellTab />, {
      wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
    });
    expect(cloudShellTabWrapper.find(CloudShellTerminal).exists()).toBe(true);
  });
});
