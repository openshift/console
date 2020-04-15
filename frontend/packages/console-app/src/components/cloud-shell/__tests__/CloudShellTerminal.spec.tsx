import * as React from 'react';
import { shallow } from 'enzyme';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import { InternalCloudShellTerminal } from '../CloudShellTerminal';
import CloudShellSetup from '../setup/CloudShellSetup';
import { CLOUD_SHELL_USER_ANNOTATION } from '../cloud-shell-utils';
import CloudShellTerminalFrame from '../CloudShellTerminalFrame';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('CloudShellTerminal', () => {
  it('should display loading box', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, false]);
    const wrapper = shallow(<InternalCloudShellTerminal username="user" />);
    expect(wrapper.find(LoadingBox)).toHaveLength(1);
  });

  it('should display form if loaded and no workspace', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const wrapper = shallow(<InternalCloudShellTerminal username="user" />);
    expect(wrapper.find(CloudShellSetup)).toHaveLength(1);
  });

  it('should display terminal if loaded with matching workspace', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([
      [
        {
          metadata: { annotations: { [CLOUD_SHELL_USER_ANNOTATION]: 'user' } },
          status: { phase: 'Running', ideUrl: 'testURL' },
        },
      ],
      true,
    ]);
    const wrapper = shallow(<InternalCloudShellTerminal username="user" />);
    const frame = wrapper.find(CloudShellTerminalFrame);
    expect(frame).toHaveLength(1);
    expect(frame.props().loading).toBe(false);
    expect(frame.props().url).toBe('testURL');
  });
});
