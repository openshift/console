import * as React from 'react';
import { PlusIcon } from '@patternfly/react-icons';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import ChoudShellTerminal from '../CloudShellTerminal';
import MultiTabTerminal from '../MultiTabbedTerminal';

describe('MultiTabTerminal', () => {
  const multiTabTerminalWrapper = mount(
    <Provider store={store}>
      <MultiTabTerminal />
    </Provider>,
  );
  it('should initially load with only one console', () => {
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(1);
  });

  it('should add terminals on add terminal icon click', () => {
    const addTerminalButton = multiTabTerminalWrapper.find('[data-test="add-terminal-icon"]').at(0);
    addTerminalButton.simulate('click');
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(2);
    addTerminalButton.simulate('click');
    addTerminalButton.simulate('click');
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(4);
  });

  it('should not allow more than 8 terminals', () => {
    const addTerminalButton = multiTabTerminalWrapper.find('[data-test="add-terminal-icon"]').at(0);
    addTerminalButton.simulate('click');
    addTerminalButton.simulate('click');
    addTerminalButton.simulate('click');
    addTerminalButton.simulate('click');
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(8);
    expect(addTerminalButton.find(<PlusIcon />).exists()).toBe(false);
    expect(multiTabTerminalWrapper.find('[data-test="add-terminal-icon"]').exists()).toBe(false);
  });

  it('should remove terminals on remove terminal icon click', () => {
    multiTabTerminalWrapper
      .find('[data-test="close-terminal-icon"]')
      .at(0)
      .simulate('click');
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(7);
    multiTabTerminalWrapper
      .find('[data-test="close-terminal-icon"]')
      .at(0)
      .simulate('click');
    multiTabTerminalWrapper
      .find('[data-test="close-terminal-icon"]')
      .at(0)
      .simulate('click');
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(5);
  });
});
