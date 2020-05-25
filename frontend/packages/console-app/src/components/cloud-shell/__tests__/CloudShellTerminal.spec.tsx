import * as React from 'react';
import { shallow } from 'enzyme';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { InternalCloudShellTerminal } from '../CloudShellTerminal';
import TerminalLoadingBox from '../TerminalLoadingBox';
import CloudShellSetup from '../setup/CloudShellSetup';
import { user } from './cloud-shell-test-data';
import useCloudShellWorkspace from '../useCloudShellWorkspace';

jest.mock('../useCloudShellWorkspace', () => ({
  default: jest.fn(),
}));

describe('CloudShellTerminal', () => {
  it('should display loading box', () => {
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false]);
    const wrapper = shallow(<InternalCloudShellTerminal user={user} />);
    expect(wrapper.find(TerminalLoadingBox)).toHaveLength(1);
  });

  it('should display error statusBox', () => {
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([null, false, true]);
    const wrapper = shallow(<InternalCloudShellTerminal user={user} />);
    expect(wrapper.find(StatusBox)).toHaveLength(1);
  });

  it('should display form if loaded and no workspace', () => {
    (useCloudShellWorkspace as jest.Mock).mockReturnValueOnce([[], true]);
    const wrapper = shallow(<InternalCloudShellTerminal user={user} />);
    expect(wrapper.find(CloudShellSetup)).toHaveLength(1);
  });
});
