import { render, screen } from '@testing-library/react';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useIsCloudShellExpanded } from '@console/webterminal-plugin/src/redux/reducers/cloud-shell-selectors';
import { CloudShellDrawer } from '../CloudShellDrawer';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/MultiTabbedTerminal', () => ({
  MultiTabbedTerminal: () => 'Terminal content',
}));

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn<boolean, []>(),
}));

jest.mock('@console/webterminal-plugin/src/redux/actions/cloud-shell-dispatchers', () => ({
  useToggleCloudShellExpanded: () => jest.fn(),
}));

jest.mock('@console/webterminal-plugin/src/redux/reducers/cloud-shell-selectors', () => ({
  useIsCloudShellExpanded: jest.fn(() => true),
}));

const mockUseFlag = useFlag as jest.Mock;
const mockUseIsCloudShellExpanded = useIsCloudShellExpanded as jest.Mock;

describe('CloudShellDrawer', () => {
  it('should render children as Drawer children when present', () => {
    mockUseFlag.mockReturnValue(true);
    mockUseIsCloudShellExpanded.mockReturnValue(true);

    render(
      <CloudShellDrawer>
        <p>Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(screen.getByText('Console webapp')).toBeVisible();
    expect(screen.getByText('Terminal content')).toBeVisible();
  });

  it('should still render children when the Drawer is closed', () => {
    mockUseFlag.mockReturnValue(true);
    mockUseIsCloudShellExpanded.mockReturnValue(false);

    render(
      <CloudShellDrawer open={false}>
        <p data-test="body">Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(screen.getByTestId('body').innerHTML).toEqual('Console webapp');
    expect(screen.queryByText('Terminal content')).not.toBeInTheDocument();
  });

  it('should render children even if web terminal is not available', () => {
    mockUseFlag.mockReturnValue(false);
    mockUseIsCloudShellExpanded.mockReturnValue(true);

    render(
      <CloudShellDrawer open={false}>
        <p>Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(screen.getByText('Console webapp')).toBeVisible();
    expect(screen.queryByText('Terminal content')).not.toBeInTheDocument();
  });
});
