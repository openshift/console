import { screen, configure, act } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
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

  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render skeleton when user preferences are loading', async () => {
    setupMocks('', false);

    await act(async () => {
      renderWithProviders(<LanguageDropdown />);
    });

    expect(screen.getByTestId('dropdown skeleton console.preferredLanguage')).toBeInTheDocument();
  });

  it('should render checked checkbox and disabled dropdown when no preferred language is set', async () => {
    setupMocks(undefined, true);

    await act(async () => {
      renderWithProviders(<LanguageDropdown />);
    });

    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByRole('button', { name: 'Select a language' })).toBeDisabled();
  });

  it('should render unchecked checkbox and enabled dropdown when preferred language is set', async () => {
    setupMocks(preferredLanguageValue, true);

    await act(async () => {
      renderWithProviders(<LanguageDropdown />);
    });

    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Select a language' })).toBeEnabled();
  });

  it('should display the selected language in dropdown text', async () => {
    setupMocks(preferredLanguageValue, true);

    await act(async () => {
      renderWithProviders(<LanguageDropdown />);
    });

    expect(screen.getByText('日本語 - Japanese')).toBeVisible();
  });
});
