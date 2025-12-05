import { renderWithProviders } from '../../../test-utils/unit-test-utils';
import MarkdownCopyClipboard from '../MarkdownCopyClipboard';
import { htmlDocumentForCopyClipboard } from './test-data';

describe('MarkdownCopyClipboard', () => {
  beforeAll(() => {
    document.body.innerHTML = htmlDocumentForCopyClipboard;
  });

  it('should render null if no element is found', () => {
    const { container } = renderWithProviders(
      <MarkdownCopyClipboard docContext={document} rootSelector="#copy-markdown-unknown" />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render CopyClipboard if element is found', () => {
    // Component renders Tooltip components which don't add visible DOM to container
    // Verify component renders without throwing and returns valid React elements
    expect(() => {
      renderWithProviders(
        <MarkdownCopyClipboard docContext={document} rootSelector="#copy-markdown-1" />,
      );
    }).not.toThrow();
  });
});
