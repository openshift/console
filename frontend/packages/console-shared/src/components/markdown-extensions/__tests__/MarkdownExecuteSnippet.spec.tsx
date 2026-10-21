import { useCloudShellAvailable } from '@console/webterminal-plugin/src/components/cloud-shell/useCloudShellAvailable';
import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import MarkdownExecuteSnippet from '../MarkdownExecuteSnippet';
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
    const { container } = renderWithProviders(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-unknown" />,
    );

    expect(container.firstChild).toBeNull();
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
    const { container } = renderWithProviders(
      <MarkdownExecuteSnippet docContext={document} rootSelector="#execute-markdown-1" />,
    );

    expect(container.firstChild).toBeNull();
  });
});
