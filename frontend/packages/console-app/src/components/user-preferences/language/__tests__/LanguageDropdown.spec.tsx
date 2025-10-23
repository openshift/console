import { screen, act } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { supportedLocales } from '../const';
import { getLastLanguage } from '../getLastLanguage';
import LanguageDropdown from '../LanguageDropdown';
import { usePreferredLanguage } from '../usePreferredLanguage';

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

jest.mock('../useLanguage', () => ({
  useLanguage: jest.fn(),
}));

jest.mock('../usePreferredLanguage', () => ({
  usePreferredLanguage: jest.fn(),
}));

jest.mock('../getLastLanguage', () => ({
  getLastLanguage: jest.fn(),
}));

const usePreferredLanguageMock = usePreferredLanguage as jest.Mock;
const getLastLanguageMock = getLastLanguage as jest.Mock;
const preferredLanguageValue = 'ja';

describe('LanguageDropdown', () => {
  const setupMocks = (preferredLang?: string, loaded = true) => {
    usePreferredLanguageMock.mockReturnValue([preferredLang, jest.fn(), loaded]);
    getLastLanguageMock.mockReturnValue(['']);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state while language preferences are being fetched', async () => {
    setupMocks('', false);

    await act(async () => {
      renderWithProviders(<LanguageDropdown />);
    });

    expect(screen.getByTestId('dropdown skeleton console.preferredLanguage')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('should show "Use browser language" option when no preference is set', async () => {
    setupMocks(undefined, true);

    await act(async () => {
      renderWithProviders(<LanguageDropdown />);
    });

    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('button', { name: 'Select a language' })).toBeDisabled();
  });

  it('should enable custom language selection when preference is set', async () => {
    setupMocks(preferredLanguageValue, true);

    await act(async () => {
      renderWithProviders(<LanguageDropdown />);
    });

    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Select a language' })).toBeEnabled();
  });

  it('should display the selected language name when preference is set', async () => {
    setupMocks(preferredLanguageValue, true);

    await act(async () => {
      renderWithProviders(<LanguageDropdown />);
    });

    expect(screen.getByText(supportedLocales.ja)).toBeVisible();
  });
});
