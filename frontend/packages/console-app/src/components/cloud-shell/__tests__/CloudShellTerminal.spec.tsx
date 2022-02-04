import * as React from 'react';
import { shallow } from 'enzyme';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { useFlag } from '@console/shared';
import { InternalCloudShellTerminal } from '../CloudShellTerminal';
import CloudShellDeveloperSetup from '../setup/CloudShellDeveloperSetup';
import TerminalLoadingBox from '../TerminalLoadingBox';
import useCloudShellNamespace from '../useCloudShellNamespace';
import useCloudShellWorkspace from '../useCloudShellWorkspace';
import { user } from './cloud-shell-test-data';

jest.mock('../useCloudShellWorkspace', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../useCloudShellNamespace', () => ({
  __esModule: true,
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

jest.mock('@console/shared', () => {
  const originalModule = (jest as any).requireActual('@console/shared');
  return {
    ...originalModule,
    useFlag: jest.fn(),
  };
});

const useFlagMock = useFlag as jest.Mock;

describe('CloudShellTerminal', () => {
  it('should display loading box', () => {
    useFlagMock.mockReturnValue(true);
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false]);
    (useCloudShellNamespace as jest.Mock).mockReturnValueOnce(['sample-namespace', '']);
    const wrapper = shallow(
      <InternalCloudShellTerminal
        user={user}
        userSettingState="my-app"
        setUserSettingState={jest.fn()}
      />,
    );
    expect(wrapper.find(TerminalLoadingBox)).toHaveLength(1);
  });

  it('should display error statusBox', () => {
    useFlagMock.mockReturnValue(true);
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false, true]);
    (useCloudShellNamespace as jest.Mock).mockReturnValueOnce(['sample-namespace', '']);
    const wrapper = shallow(
      <InternalCloudShellTerminal
        user={user}
        userSettingState="my-app"
        setUserSettingState={jest.fn()}
      />,
    );
    expect(wrapper.find(StatusBox)).toHaveLength(1);
  });

  it('should display form if loaded and no workspace', () => {
    useFlagMock.mockReturnValue(true);
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([[], true]);
    (useCloudShellNamespace as jest.Mock).mockReturnValueOnce(['sample-namespace', '']);
    const wrapper = shallow(
      <InternalCloudShellTerminal
        user={user}
        userSettingState="my-app"
        setUserSettingState={jest.fn()}
      />,
    );
    expect(wrapper.find(CloudShellDeveloperSetup)).toHaveLength(1);
  });
});
