import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useCloudShellAvailable } from '@console/webterminal-plugin/src/components/cloud-shell/useCloudShellAvailable';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import { MarkdownExecuteSnippet } from '../MarkdownExecuteSnippet';
import { htmlDocumentForExecuteButton } from './test-data';

jest.mock('@console/webterminal-plugin/src/components/cloud-shell/useCloudShellAvailable', () => ({
  useCloudShellAvailable: jest.fn(),
}));

const mockUseCloudShellAvailable = useCloudShellAvailable as jest.Mock;

describe('MarkdownExecuteSnippet', () => {
  beforeAll(() => {
    document.body.innerHTML = htmlDocumentForExecuteButton;
  });

  it('should render null if no element is found', () => {
    mockUseCloudShellAvailable.mockReturnValue(true);
    renderWithProviders(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-unknown" />,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should render components if element is found and cloudshell available', () => {
    mockUseCloudShellAvailable.mockReturnValue(true);
    expect(() => {
      renderWithProviders(
        <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-1" />,
      );
    }).not.toThrow();
  });

  it('should render null if cloudshell is not available', () => {
    mockUseCloudShellAvailable.mockReturnValue(false);
    renderWithProviders(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-1" />,
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should remove data-executed attribute on focus', async () => {
    mockUseCloudShellAvailable.mockReturnValue(true);
    const user = userEvent.setup();
    const button = screen.getAllByRole('button')[0];
    button.setAttribute('data-executed', '');

    renderWithProviders(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-1" />,
    );

    await user.tab();
    expect(button.hasAttribute('data-executed')).toBe(false);
  });
});
