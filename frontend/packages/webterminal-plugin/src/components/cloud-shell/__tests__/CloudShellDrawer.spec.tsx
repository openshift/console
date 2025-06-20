import { configure, render } from '@testing-library/react';
import CloudShellDrawer from '../CloudShellDrawer';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

const MockMultiTabbedTerminal = () => <p data-test="terminal-content">Terminal content</p>;

describe('CloudShellDrawerComponent', () => {
  beforeEach(() => {
    configure({ testIdAttribute: 'data-test' });
  });
  it('should render children as Drawer children when present', () => {
    const wrapper = render(
      <CloudShellDrawer onClose={() => null} TerminalBody={MockMultiTabbedTerminal}>
        <p>Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.getByTestId('terminal-content').innerHTML).toEqual('Terminal content');
  });

  it('should still render children when the Drawer is closed', () => {
    const wrapper = render(
      <CloudShellDrawer onClose={() => null} open={false} TerminalBody={MockMultiTabbedTerminal}>
        <p data-test="body">Console webapp</p>
      </CloudShellDrawer>,
    );
    expect(wrapper.getByTestId('body').innerHTML).toEqual('Console webapp');
  });
});
