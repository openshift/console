import { render, screen, waitFor } from '@testing-library/react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import type * as ThemeProviderModule from '../ThemeProvider';

jest.mock('@console/app/src/features/openshift5', () => ({ IS_OPENSHIFT_5: false }));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const mockUseUserPreference = useUserPreference as jest.Mock;
const setColorScheme = jest.fn();
const setContrastMode = jest.fn();

window.matchMedia = jest.fn(
  (media: string) =>
    ({
      matches: false,
      media,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }) as unknown as MediaQueryList,
);

let themeModule: typeof ThemeProviderModule;

const ThemeProbe = () => {
  const { theme, contrast } = themeModule.useTheme();
  return <div>{`${contrast} · ${theme}`}</div>;
};

describe('ThemeProvider outside OpenShift 5', () => {
  beforeAll(async () => {
    themeModule = await import('../ThemeProvider');
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.documentElement.classList.remove(
      'pf-v6-theme-dark',
      'pf-v6-theme-glass',
      'pf-v6-theme-high-contrast',
    );
  });

  it.each(['default', 'glass', 'contrast', 'systemDefault'])(
    'should resolve stored %s contrast to Traditional without rewriting it',
    async (storedContrast) => {
      const preferences: Record<string, string> = {
        'console.theme': 'light',
        'console.theme/contrast': storedContrast,
      };
      mockUseUserPreference.mockImplementation((key: string) => [
        preferences[key],
        key === 'console.theme' ? setColorScheme : setContrastMode,
        true,
      ]);
      const Provider = themeModule.ThemeProvider;
      render(
        <Provider>
          <ThemeProbe />
        </Provider>,
      );

      await waitFor(() => expect(screen.getByText('default · light')).toBeVisible());
      expect(document.documentElement).not.toHaveClass('pf-v6-theme-glass');
      expect(document.documentElement).not.toHaveClass('pf-v6-theme-high-contrast');
      expect(setColorScheme).not.toHaveBeenCalled();
      expect(setContrastMode).not.toHaveBeenCalled();
    },
  );
});
