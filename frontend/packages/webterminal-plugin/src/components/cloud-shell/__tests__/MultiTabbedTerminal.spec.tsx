import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { sendActivityTick } from '../cloud-shell-utils';
import { MultiTabbedTerminal } from '../MultiTabbedTerminal';

jest.mock('../cloud-shell-utils', () => {
  return {
    sendActivityTick: jest.fn(),
  };
});

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/CloudShellTerminal', () => ({
  default: () => 'Terminal content',
}));

const originalWindowRequestAnimationFrame = window.requestAnimationFrame;

describe('MultiTabTerminal', () => {
  jest.useFakeTimers();
  (sendActivityTick as jest.Mock).mockImplementation((a, b) => [a, b]);

  beforeAll(() => {
    window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  });

  afterAll(() => {
    window.requestAnimationFrame = originalWindowRequestAnimationFrame;
  });

  it('should initially load with only one console', () => {
    const multiTabTerminalWrapper = render(
      <Provider store={store}>
        <MultiTabbedTerminal />
      </Provider>,
    );

    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(1);
  });

  it('should add terminals on add terminal icon click', () => {
    const multiTabTerminalWrapper = render(
      <Provider store={store}>
        <MultiTabbedTerminal />
      </Provider>,
    );

    const addTerminalButton = multiTabTerminalWrapper.getByLabelText('Add new tab');
    addTerminalButton.click();
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(2);
    addTerminalButton.click();
    addTerminalButton.click();
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(4);
  });

  it('should not allow more than 8 terminals', () => {
    const multiTabTerminalWrapper = render(
      <Provider store={store}>
        <MultiTabbedTerminal />
      </Provider>,
    );

    const addTerminalButton = multiTabTerminalWrapper.getByLabelText('Add new tab');
    for (let i = 0; i < 8; i++) {
      addTerminalButton.click();
    }
    expect(multiTabTerminalWrapper.getAllByText('Terminal content')).toHaveLength(8);
    expect(multiTabTerminalWrapper.queryByLabelText('Add new tab')).toBeNull();
  });

  it('should remove terminals on remove terminal icon click', () => {
    const multiTabTerminalWrapper = render(
      <Provider store={store}>
        <MultiTabbedTerminal />
      </Provider>,
    );

    const addTerminalButton = multiTabTerminalWrapper.getByLabelText('Add new tab');
    for (let i = 0; i < 8; i++) {
      addTerminalButton.click();
    }

    multiTabTerminalWrapper.getAllByLabelText('Close terminal tab').at(7).click();
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(7);
    multiTabTerminalWrapper.getAllByLabelText('Close terminal tab').at(6).click();
    multiTabTerminalWrapper.getAllByLabelText('Close terminal tab').at(5).click();
    expect(multiTabTerminalWrapper.getAllByText('Terminal content').length).toBe(5);
  });

  jest.clearAllTimers();
});
