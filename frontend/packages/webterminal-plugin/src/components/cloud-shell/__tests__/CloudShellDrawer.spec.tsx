import { configure, render } from '@testing-library/react';
import CloudShellDrawer from '../CloudShellDrawer';
import '@testing-library/jest-dom';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/MultiTabbedTerminal', () => ({
  MultiTabbedTerminal: () => 'Terminal content',
}));

describe('CloudShellDrawerComponent', () => {
  beforeEach(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  it('should render children as Drawer children when present', () => {
    const wrapper = render(
      <CloudShellDrawer onClose={() => null}>
        <p>Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.getByText('Console webapp')).toBeInTheDocument();
    expect(wrapper.getByText('Terminal content')).toBeInTheDocument();
  });

  it('should still render children when the Drawer is closed', () => {
    const wrapper = render(
      <CloudShellDrawer onClose={() => null} open={false}>
        <p data-test="body">Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.getByTestId('body').innerHTML).toEqual('Console webapp');
    expect(wrapper.queryByText('Terminal content')).not.toBeInTheDocument();
  });
});
