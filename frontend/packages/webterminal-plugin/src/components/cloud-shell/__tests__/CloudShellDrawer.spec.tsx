import { render } from '@testing-library/react';
import { useFlag } from '@console/shared/src/hooks/flag';
import { useIsCloudShellExpanded } from '@console/webterminal-plugin/src/redux/reducers/cloud-shell-selectors';
import { CloudShellDrawer } from '../CloudShellDrawer';
import '@testing-library/jest-dom';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/MultiTabbedTerminal', () => ({
  MultiTabbedTerminal: () => 'Terminal content',
}));

jest.mock('@console/shared/src/hooks/flag', () => ({
  useFlag: jest.fn(),
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

    const wrapper = render(
      <CloudShellDrawer>
        <p>Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.getByText('Console webapp')).toBeInTheDocument();
    expect(wrapper.getByText('Terminal content')).toBeInTheDocument();
  });

  it('should still render children when the Drawer is closed', () => {
    mockUseFlag.mockReturnValue(true);
    mockUseIsCloudShellExpanded.mockReturnValue(false);

    const wrapper = render(
      <CloudShellDrawer open={false}>
        <p data-test="body">Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.getByTestId('body').innerHTML).toEqual('Console webapp');
    expect(wrapper.queryByText('Terminal content')).not.toBeInTheDocument();
  });

  it('should render children even if web terminal is not available', () => {
    mockUseFlag.mockReturnValue(false);
    mockUseIsCloudShellExpanded.mockReturnValue(true);

    const wrapper = render(
      <CloudShellDrawer open={false}>
        <p>Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.getByText('Console webapp')).toBeInTheDocument();
    expect(wrapper.queryByText('Terminal content')).not.toBeInTheDocument();
  });
});
