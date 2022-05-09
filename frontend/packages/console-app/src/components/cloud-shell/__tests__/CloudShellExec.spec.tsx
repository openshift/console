import * as React from 'react';
import { mount } from 'enzyme';
import { FLAGS } from '@console/shared';
import { WorkspaceModel } from '../../../models';
import { InternalCloudShellExec, CloudShellExecProps } from '../CloudShellExec';
import TerminalLoadingBox from '../TerminalLoadingBox';
import useActivityTick from '../useActivityTick';

Object.defineProperty(window, 'requestAnimationFrame', {
  writable: true,
  value: (callback) => callback(),
});

jest.mock('../useActivityTick', () => ({
  default: jest.fn(),
}));

const workspace = 'test1';
const namespace = 'namespace1';

const cloudShellExecProps: CloudShellExecProps = {
  workspaceName: workspace,
  container: 'test1',
  podname: 'testpod',
  namespace,
  workspaceModel: WorkspaceModel,
  onActivate: () => {},
  flags: { [FLAGS.OPENSHIFT]: true },
};

beforeEach(() => {
  jest.useFakeTimers();

  let count = 0;
  jest
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation((cb) => setTimeout(() => cb(100 * ++count), 100));
});

afterEach(() => {
  (window.requestAnimationFrame as any).mockRestore();
  jest.clearAllTimers();
});

describe('CloudShellExec', () => {
  it('should call requestAnimationFrame and useActivityTick On Mount', () => {
    jest.useFakeTimers();
    (useActivityTick as jest.Mock).mockImplementation((w, n) => {
      return [w, n];
    });
    const wrapper = mount(<InternalCloudShellExec {...cloudShellExecProps} isActiveTab />);
    expect(wrapper.find(TerminalLoadingBox).exists()).toBe(true);
    expect(requestAnimationFrame).toHaveBeenCalled();
    expect(useActivityTick).toHaveBeenCalledTimes(1);
    expect(useActivityTick).toHaveBeenCalledWith(workspace, namespace);
  });
});
