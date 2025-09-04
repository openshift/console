import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useUserSettings } from '@console/shared';
import { SyncMarkdownView } from '../markdown-view';

jest.mock('showdown', () => ({
  Converter: class {
    makeHtml = (markdown) => markdown;
    addExtension = (extension) => extension;
  },
}));

jest.mock('@openshift-console/plugin-shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;

describe('markdown-view', () => {
  it('should render markdown view inline and iframe modes correctly', () => {
    mockUserSettings.mockReturnValue(['light', jest.fn(), true]);

    // Test iframe mode (default)
    const { rerender } = render(<SyncMarkdownView />);
    expect(document.querySelector('iframe')).toBeInTheDocument();

    // Test inline mode
    rerender(<SyncMarkdownView inline />);
    expect(document.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('should call renderExtension when extensions are provided', () => {
    const renderExtension = jest.fn();
    mockUserSettings.mockReturnValue(['light', jest.fn(), true]);

    // Should not call renderExtension without extensions
    render(<SyncMarkdownView renderExtension={renderExtension} />);
    expect(renderExtension).not.toHaveBeenCalled();

    render(<SyncMarkdownView inline renderExtension={renderExtension} />);
    expect(renderExtension).not.toHaveBeenCalled();

    // Should call renderExtension when extensions are provided
    renderExtension.mockReset();
    render(
      <SyncMarkdownView
        inline
        extensions={[{ type: 'test-extension' }]}
        renderExtension={renderExtension}
      />,
    );
    expect(renderExtension).toHaveBeenCalled();
  });
});
