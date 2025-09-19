import * as React from 'react';
import { render, screen, configure } from '@testing-library/react';
import { getLastLanguage } from '../getLastLanguage';
import LanguageDropdown from '../LanguageDropdown';
import { usePreferredLanguage } from '../usePreferredLanguage';

jest.mock('react', () => {
  const reactActual = jest.requireActual('react');
  return {
    ...reactActual,
    useContext: () => jest.fn(),
  };
});

jest.mock('@console/shared/src/hooks/useTelemetry', () => ({
  useTelemetry: () => {},
}));

jest.mock('react-i18next', () => {
  const reactI18next = jest.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({
      t: (key: string) => key,
      i18n: {
        getResourceBundle: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        changeLanguage: jest.fn(),
      },
    }),
  };
});

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
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render skeleton if user preferences have not loaded', () => {
    usePreferredLanguageMock.mockReturnValue(['', jest.fn(), false]);
    getLastLanguageMock.mockReturnValue(['']);
    jest.spyOn(React, 'useContext').mockReturnValue({ getProcessedResourceBundle: jest.fn() });

    render(<LanguageDropdown />);

    expect(screen.getByTestId('dropdown skeleton console.preferredLanguage')).toBeInTheDocument();
  });

  it('should render checkbox in checked state and select in disabled state if user preferences have loaded and preferred language is not defined', () => {
    usePreferredLanguageMock.mockReturnValue([undefined, jest.fn(), true]);
    getLastLanguageMock.mockReturnValue(['']);
    jest.spyOn(React, 'useContext').mockReturnValue({ getProcessedResourceBundle: jest.fn() });

    render(<LanguageDropdown />);

    expect(screen.getByTestId('checkbox console.preferredLanguage')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeChecked();
    expect(screen.getByTestId('dropdown console.preferredLanguage')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should render checkbox in unchecked state and select in enabled state if user preferences have loaded and preferred language is defined', () => {
    usePreferredLanguageMock.mockReturnValue([preferredLanguageValue, jest.fn(), true]);
    getLastLanguageMock.mockReturnValue(['']);
    jest.spyOn(React, 'useContext').mockReturnValue({ getProcessedResourceBundle: jest.fn() });

    render(<LanguageDropdown />);

    expect(screen.getByTestId('checkbox console.preferredLanguage')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(screen.getByTestId('dropdown console.preferredLanguage')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeEnabled();
  });

  it('should render select with value corresponding to preferred language if user preferences have loaded and preferred language is defined', () => {
    usePreferredLanguageMock.mockReturnValue([preferredLanguageValue, jest.fn(), true]);
    getLastLanguageMock.mockReturnValue(['']);
    jest.spyOn(React, 'useContext').mockReturnValue({ getProcessedResourceBundle: jest.fn() });

    render(<LanguageDropdown />);

    expect(screen.getByTestId('checkbox console.preferredLanguage')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown console.preferredLanguage')).toBeInTheDocument();
    // Check that the dropdown shows the preferred language value
    expect(screen.getByDisplayValue(preferredLanguageValue)).toBeInTheDocument();
  });
});
