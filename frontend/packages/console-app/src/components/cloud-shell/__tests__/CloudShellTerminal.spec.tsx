import * as React from 'react';
import { shallow } from 'enzyme';
import { StatusBox } from '@console/internal/components/utils/status-box';
import CloudShellTerminal from '../CloudShellTerminal';
import CloudShellDeveloperSetup from '../setup/CloudShellDeveloperSetup';
import TerminalLoadingBox from '../TerminalLoadingBox';
import useCloudShellNamespace from '../useCloudShellNamespace';
import useCloudShellWorkspace from '../useCloudShellWorkspace';
import { user } from './cloud-shell-test-data';

jest.mock('../useCloudShellWorkspace', () => ({
  default: jest.fn(),
}));

jest.mock('../useCloudShellNamespace', () => ({
  default: jest.fn(),
}));

const cloudShellTerminalProps = {
  isAdminCheckLoading: false,
  isv1Alpha2Available: true,
  user,
  namespace: 'test',
  setNamespace: () => null,
};

describe('CloudShellTerminal', () => {
  beforeEach(() => {
    (useCloudShellNamespace as jest.Mock).mockReturnValueOnce(['sample-namespace', '']);
  });

  it('should display loading box', () => {
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false]);
    const wrapper = shallow(<CloudShellTerminal {...cloudShellTerminalProps} isAdmin />);
    expect(wrapper.find(TerminalLoadingBox)).toHaveLength(1);
  });

  it('should display error statusBox', () => {
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false, true]);
    const wrapper = shallow(<CloudShellTerminal {...cloudShellTerminalProps} isAdmin />);
    expect(wrapper.find(StatusBox)).toHaveLength(1);
  });

  it('should display form if loaded and no workspace', () => {
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([[], true]);
    const wrapper = shallow(<CloudShellTerminal {...cloudShellTerminalProps} isAdmin={false} />);
    expect(wrapper.find(CloudShellDeveloperSetup)).toHaveLength(1);
  });
});
