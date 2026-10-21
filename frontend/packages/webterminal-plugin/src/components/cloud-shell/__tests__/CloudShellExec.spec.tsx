import { render, screen } from '@testing-library/react';
import { FLAGS } from '@console/shared';
import { WorkspaceModel } from '../../../../models';
import type { CloudShellExecProps } from '../CloudShellExec';
import { InternalCloudShellExec } from '../CloudShellExec';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => () => {},
}));

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
    render(<InternalCloudShellExec {...cloudShellExecProps} />);
    expect(screen.getByTestId('loading-box')).toBeInTheDocument();
  });
});
