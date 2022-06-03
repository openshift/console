import * as React from 'react';
import { shallow, mount } from 'enzyme';
import { useFlag } from '@console/shared';
import { sendActivityTick } from '../cloud-shell-utils';
import ChoudShellTerminal from '../CloudShellTerminal';
import { InternalMultiTabTerminal as MultiTabTerminal } from '../MultiTabbedTerminal';
import useCloudShellNamespace from '../useCloudShellNamespace';
import useCloudShellWorkspace from '../useCloudShellWorkspace';
import { user } from './cloud-shell-test-data';

jest.mock('../useCloudShellWorkspace', () => ({
  default: jest.fn(),
}));

jest.mock('../useCloudShellNamespace', () => ({
  default: jest.fn(),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview2: () => [false, false],
}));

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => {
  return {
    useUserSettingsCompatibility: () => ['', () => {}],
  };
});

jest.mock('../cloud-shell-utils', () => {
  return {
    sendActivityTick: jest.fn(),
  };
});

jest.mock('@console/shared', () => {
  const originalModule = (jest as any).requireActual('@console/shared');
  return {
    ...originalModule,
    useFlag: jest.fn<boolean>(),
  };
});

const useFlagMock = useFlag as jest.Mock;

const testData = { namespace: 'test', workspaceName: 'wn' };

describe('MultiTabTerminal', () => {
  let multiTabTerminalWrapper;

  const simulateAddTerminalClick = () => {
    const addTerminalTab = multiTabTerminalWrapper.find('[data-test="add-terminal-tab"]');
    const addTerminalButton = addTerminalTab.shallow().find('[data-test="add-terminal-tab"]');
    addTerminalButton.simulate('click');
  };

  const simulateRemoveTerminalClick = () => {
    const stopPropagation = jest.fn();
    const tabBase = multiTabTerminalWrapper
      .find('[data-test="multi-tab-terminal-tab"]')
      .at(0)
      .shallow()
      .find('[data-test="multi-tab-terminal-tab"]')
      .shallow();
    const removeTerminalButton = tabBase.find('[data-test="close-terminal-icon"]');
    removeTerminalButton.simulate('click', { stopPropagation });
  };

  beforeAll(() => {
    useFlagMock.mockReturnValue(true);
    (useCloudShellWorkspace as jest.Mock).mockReturnValue([
      { metadata: { name: testData.workspaceName, namespace: testData.namespace } },
      true,
      '',
    ]);

    multiTabTerminalWrapper = shallow(
      <MultiTabTerminal user={user} userSettingState="my-app" setUserSettingState={jest.fn()} />,
    );
  });

  it('should initially load with only one console', () => {
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(1);
  });

  it('should add terminals on add terminal icon click', () => {
    simulateAddTerminalClick();
    simulateAddTerminalClick();
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(3);
  });

  it('should not allow more than 8 terminals', () => {
    simulateAddTerminalClick();
    simulateAddTerminalClick();
    simulateAddTerminalClick();
    simulateAddTerminalClick();
    simulateAddTerminalClick();
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(8);
    expect(multiTabTerminalWrapper.find('[data-test="add-terminal-tab"]').exists()).toBe(false);
  });

  it('should remove terminals on remove terminal icon click', () => {
    simulateRemoveTerminalClick();
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(7);
    simulateRemoveTerminalClick();
    simulateRemoveTerminalClick();
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(5);
  });
});

describe('MultiTabTerminal tick', () => {
  let multiTabTerminalWrapper;

  beforeAll(() => {
    useFlagMock.mockReturnValue(true);
    (useCloudShellWorkspace as jest.Mock).mockReturnValue([
      { metadata: { name: testData.workspaceName, namespace: testData.namespace } },
      true,
      '',
    ]);

    (useCloudShellNamespace as jest.Mock).mockReturnValueOnce(['sample-namespace', '']);

    let count = 0;
    jest.spyOn(window, 'setInterval').mockImplementation((cb, time) => cb(100 * ++count + time));

    jest.spyOn(window, 'addEventListener').mockImplementation((a, b) => [a, b]);

    (sendActivityTick as jest.Mock).mockImplementation((a, b) => [a, b]);

    multiTabTerminalWrapper = mount(
      <MultiTabTerminal
        user={user}
        userSettingState={testData.namespace}
        setUserSettingState={jest.fn()}
      />,
    );
  });

  afterAll(() => {
    (window.requestAnimationFrame as any).mockRestore();
    jest.clearAllTimers();
  });

  it('sets tick function to signal activityTick', () => {
    expect(multiTabTerminalWrapper.find(ChoudShellTerminal).length).toBe(1);
    expect(window.addEventListener).toHaveBeenCalled();
    expect(setInterval).toHaveBeenCalled();
    expect(sendActivityTick).toHaveBeenCalledTimes(1);
    expect(sendActivityTick).toHaveBeenCalledWith(testData.namespace, testData.workspaceName);
  });
});
