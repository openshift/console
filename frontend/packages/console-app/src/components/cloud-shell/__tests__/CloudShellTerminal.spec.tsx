import * as React from 'react';
import { shallow } from 'enzyme';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { InternalCloudShellTerminal } from '../CloudShellTerminal';
import TerminalLoadingBox from '../TerminalLoadingBox';
import { user } from './cloud-shell-test-data';
import useCloudShellWorkspace from '../useCloudShellWorkspace';
import CloudShellDeveloperSetup from '../setup/CloudShellDeveloperSetup';
import * as cloudShellUtils from '../cloud-shell-utils';

jest.mock('../useCloudShellWorkspace', () => ({
  default: jest.fn(),
}));

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview2: () => [false, false],
}));

jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => {
  return {
    useUserSettingsCompatibility: () => ['', () => {}],
  };
});

describe('CloudShellTerminal', () => {
  beforeEach(() => {
    jest
      .spyOn(cloudShellUtils, 'useV1alpha2CRDAvailability')
      .mockImplementation(() => [true, false]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display loading box', () => {
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false]);
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
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false, true]);
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
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([[], true]);
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
