import * as React from 'react';
import { mount } from 'enzyme';
import { FLAGS } from '@console/shared';
import { WorkspaceModel } from '../../../models';
import { InternalCloudShellExec, CloudShellExecProps } from '../CloudShellExec';
import TerminalLoadingBox from '../TerminalLoadingBox';

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

describe('CloudShellExec', () => {
  it('should call requestAnimationFrame and useActivityTick On Mount', () => {
    const wrapper = mount(<InternalCloudShellExec {...cloudShellExecProps} />);
    expect(wrapper.find(TerminalLoadingBox).exists()).toBe(true);
  });
});
