import * as React from 'react';
import { shallow } from 'enzyme';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { StatusBox } from '@console/internal/components/utils/status-box';
import { InternalCloudShellTerminal } from '../CloudShellTerminal';
import TerminalLoadingBox from '../TerminalLoadingBox';
import CloudShellSetup from '../setup/CloudShellSetup';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('CloudShellTerminal', () => {
  it('should display loading box', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, false]);
    const wrapper = shallow(<InternalCloudShellTerminal username="user" />);
    expect(wrapper.find(TerminalLoadingBox)).toHaveLength(1);
  });

  it('should display error statusBox', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, false, true]);
    const wrapper = shallow(<InternalCloudShellTerminal username="user" />);
    expect(wrapper.find(StatusBox)).toHaveLength(1);
  });

  it('should display form if loaded and no workspace', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const wrapper = shallow(<InternalCloudShellTerminal username="user" />);
    expect(wrapper.find(CloudShellSetup)).toHaveLength(1);
  });
});
