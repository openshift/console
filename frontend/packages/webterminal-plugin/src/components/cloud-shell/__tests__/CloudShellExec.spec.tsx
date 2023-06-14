import * as React from 'react';
import { mount } from 'enzyme';
import { FLAGS } from '@console/shared';
import { WorkspaceModel } from '../../../../models';
import { InternalCloudShellExec, CloudShellExecProps } from '../CloudShellExec';
import TerminalLoadingBox from '../TerminalLoadingBox';

jest.mock('@console/shared', () => {
  const originalModule = (jest as any).requireActual('@console/shared');
  return {
    ...originalModule,
    useTelemetry: () => {},
  };
});

const workspace = 'test1';
const namespace = 'namespace1';

const cloudShellExecProps: CloudShellExecProps = {
  workspaceName: workspace,
  workspaceId: '12377979',
  container: 'test1',
  podname: 'testpod',
  namespace,
  workspaceModel: WorkspaceModel,
  onActivate: () => {},
  flags: { [FLAGS.OPENSHIFT]: true },
};

describe('CloudShellExec', () => {
  it('should TerminalLoadingBox On Mount', () => {
    const wrapper = mount(<InternalCloudShellExec {...cloudShellExecProps} />);
    expect(wrapper.find(TerminalLoadingBox).exists()).toBe(true);
  });
});
