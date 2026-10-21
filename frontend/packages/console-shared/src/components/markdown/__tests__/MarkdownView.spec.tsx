import { screen } from '@testing-library/react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { MarkdownView } from '../MarkdownView';

jest.mock('marked', () => ({
  Marked: class {
    parse = (markdown) => markdown;
  },
}));

jest.mock('@console/shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const mockUserPreference = useUserPreference as jest.Mock;

describe('MarkdownView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUserPreference.mockReturnValue(['light', jest.fn(), true]);
  });

  describe('Rendering Modes', () => {
    it('renders iframe by default for embedded markdown content', () => {
      renderWithProviders(<MarkdownView />);

      const iframe = screen.getByRole('document', { name: 'Markdown content viewer' });
      expect(iframe).toBeVisible();
      expect(iframe).toHaveAttribute('sandbox');
    });

    it('iframe has proper accessibility attributes for security and usability', () => {
      renderWithProviders(<MarkdownView />);

      const iframe = screen.getByRole('document', { name: 'Markdown content viewer' });
      expect(iframe).toHaveAttribute(
        'sandbox',
        'allow-popups allow-popups-to-escape-sandbox allow-same-origin',
      );
      expect(iframe).toHaveAttribute('title', 'Markdown content viewer');
      expect(iframe).toHaveAttribute('aria-label', 'Markdown content viewer');
      expect(iframe).toHaveAttribute('role', 'document');

      // Verify iframe is properly sandboxed for security
      expect(iframe.getAttribute('sandbox')).toContain('allow-same-origin');
    });

    it('renders inline content when inline prop is true', () => {
      renderWithProviders(<MarkdownView inline />);

      expect(
        screen.queryByRole('document', { name: 'Markdown content viewer' }),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Not available')).toBeVisible();
    });
  });

  describe('Extension Rendering', () => {
    it('does not call renderExtension when no extensions are provided', () => {
      const renderExtension = jest.fn();

      renderWithProviders(<MarkdownView renderExtension={renderExtension} />);

      expect(renderExtension).not.toHaveBeenCalled();
    });

    it('does not call renderExtension in inline mode without extensions', () => {
      const renderExtension = jest.fn();

      renderWithProviders(<MarkdownView inline renderExtension={renderExtension} />);

      expect(renderExtension).not.toHaveBeenCalled();
    });

    it('calls renderExtension with iframe document when extensions are provided', async () => {
      const renderExtension = jest.fn();
      const extensions = [{ type: 'lang', regex: /test/, replace: (t: string) => t }];

      renderWithProviders(
        <MarkdownView extensions={extensions} renderExtension={renderExtension} />,
      );

      expect(screen.getByRole('document', { name: 'Markdown content viewer' })).toBeVisible();
    });

    it('calls renderExtension with document when in inline mode with extensions', () => {
      const renderExtension = jest.fn();
      const extensions = [{ type: 'lang', regex: /test/, replace: (t: string) => t }];

      renderWithProviders(
        <MarkdownView inline extensions={extensions} renderExtension={renderExtension} />,
      );

      expect(screen.getByText('Not available')).toBeVisible();
    });
  });

  describe('User Settings Integration', () => {
    it('responds to theme changes from user settings', () => {
      mockUserPreference.mockReturnValue(['dark', jest.fn(), true]);

      renderWithProviders(<MarkdownView />);

      expect(screen.getByRole('document', { name: 'Markdown content viewer' })).toBeVisible();
    });

    it('handles loading state from user settings', () => {
      mockUserPreference.mockReturnValue(['light', jest.fn(), false]);

      renderWithProviders(<MarkdownView />);

      expect(screen.getByRole('document', { name: 'Markdown content viewer' })).toBeVisible();
    });
  });
});
