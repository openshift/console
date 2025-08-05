import { configure, render } from '@testing-library/react';
import { useCloudShellAvailable } from '@console/webterminal-plugin/src/components/cloud-shell/useCloudShellAvailable';
import { useIsCloudShellExpanded } from '@console/webterminal-plugin/src/redux/reducers/cloud-shell-selectors';
import { CloudShellDrawer } from '../CloudShellDrawer';
import '@testing-library/jest-dom';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/MultiTabbedTerminal', () => ({
  MultiTabbedTerminal: () => 'Terminal content',
}));

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/useCloudShellAvailable', () => ({
  useCloudShellAvailable: jest.fn(),
}));

jest.mock('@console/webterminal-plugin/src/redux/actions/cloud-shell-dispatchers', () => ({
  useToggleCloudShellExpanded: () => jest.fn(),
}));

jest.mock('@console/webterminal-plugin/src/redux/reducers/cloud-shell-selectors', () => ({
  useIsCloudShellExpanded: jest.fn(() => true),
}));

const mockUseCloudShellAvailable = useCloudShellAvailable as jest.Mock;
const mockUseIsCloudShellExpanded = useIsCloudShellExpanded as jest.Mock;

configure({ testIdAttribute: 'data-test' });

describe('CloudShellDrawer', () => {
  it('should render children as Drawer children when present', () => {
    mockUseCloudShellAvailable.mockReturnValue(true);
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
    mockUseCloudShellAvailable.mockReturnValue(true);
    mockUseIsCloudShellExpanded.mockReturnValue(false);

    const wrapper = render(
      <CloudShellDrawer>
        <p data-test="body">Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.getByTestId('body').innerHTML).toEqual('Console webapp');
    expect(wrapper.queryByText('Terminal content')).not.toBeInTheDocument();
  });

  it('should render children even if web terminal is not available', () => {
    mockUseCloudShellAvailable.mockReturnValue(false);
    mockUseIsCloudShellExpanded.mockReturnValue(true);

    const wrapper = render(
      <CloudShellDrawer>
        <p>Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.getByText('Console webapp')).toBeInTheDocument();
    expect(wrapper.queryByText('Terminal content')).not.toBeInTheDocument();
  });
});
