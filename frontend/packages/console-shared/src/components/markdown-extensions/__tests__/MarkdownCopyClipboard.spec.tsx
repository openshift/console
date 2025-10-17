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
    const { container } = renderWithProviders(
      <MarkdownCopyClipboard docContext={document} rootSelector="#copy-markdown-1" />,
    );

    expect(container).toBeInTheDocument();
  });
});
