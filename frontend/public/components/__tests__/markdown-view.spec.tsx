import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
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

    const { rerender, container } = renderWithProviders(<SyncMarkdownView />);

    expect(container.querySelector('iframe')).toBeInTheDocument();

    rerender(<SyncMarkdownView inline />);

    expect(container.querySelector('iframe')).not.toBeInTheDocument();
  });

  it('should call renderExtension when extensions are provided', () => {
    const renderExtension = jest.fn();
    mockUserSettings.mockReturnValue(['light', jest.fn(), true]);

    renderWithProviders(<SyncMarkdownView renderExtension={renderExtension} />);
    expect(renderExtension).not.toHaveBeenCalled();

    renderWithProviders(<SyncMarkdownView inline renderExtension={renderExtension} />);
    expect(renderExtension).not.toHaveBeenCalled();

    renderExtension.mockReset();
    renderWithProviders(
      <SyncMarkdownView
        inline
        extensions={[{ type: 'test-extension' }]}
        renderExtension={renderExtension}
      />,
    );
    expect(renderExtension).toHaveBeenCalled();
  });
});
