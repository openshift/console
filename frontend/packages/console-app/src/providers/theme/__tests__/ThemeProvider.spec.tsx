import { act, render, screen, waitFor } from '@testing-library/react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import type * as ThemeProviderModule from '../ThemeProvider';

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const mockUseUserPreference = useUserPreference as jest.Mock;
const setColorScheme = jest.fn();
const setContrastMode = jest.fn();

type MediaListener = (event: MediaQueryListEvent) => void;

const createMediaController = (media: string) => {
  const listeners = new Set<MediaListener>();
  const mediaQuery = {
    matches: false,
    media,
    onchange: null,
    addEventListener: jest.fn((_event: string, callback: MediaListener) => listeners.add(callback)),
    removeEventListener: jest.fn((_event: string, callback: MediaListener) =>
      listeners.delete(callback),
    ),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  } as unknown as MediaQueryList;

  return {
    mediaQuery,
    setMatches: (matches: boolean) => {
      Object.defineProperty(mediaQuery, 'matches', { configurable: true, value: matches });
    },
    change: (matches: boolean) => {
      Object.defineProperty(mediaQuery, 'matches', { configurable: true, value: matches });
      listeners.forEach((listener) => listener({ matches } as MediaQueryListEvent));
    },
    reset: () => {
      listeners.clear();
      Object.defineProperty(mediaQuery, 'matches', { configurable: true, value: false });
      (mediaQuery.addEventListener as jest.Mock).mockClear();
      (mediaQuery.removeEventListener as jest.Mock).mockClear();
    },
  };
};

const darkMedia = createMediaController('(prefers-color-scheme: dark)');
const contrastMedia = createMediaController('(prefers-contrast: more)');

window.matchMedia = jest.fn((query: string) =>
  query === '(prefers-contrast: more)' ? contrastMedia.mediaQuery : darkMedia.mediaQuery,
);

let themeModule: typeof ThemeProviderModule;

const contrastCases = [
  { contrastValue: 'default', resolvedContrast: 'default' },
  { contrastValue: 'glass', resolvedContrast: 'glass' },
  { contrastValue: 'contrast', resolvedContrast: 'contrast' },
  { contrastValue: 'systemDefault', resolvedContrast: 'glass' },
] as const;
const colorCases = [
  { colorValue: 'light', resolvedColor: 'light' },
  { colorValue: 'dark', resolvedColor: 'dark' },
  { colorValue: 'systemDefault', resolvedColor: 'light' },
] as const;
const storedSelectionPairs = contrastCases.flatMap((contrast) =>
  colorCases.map((color) => ({ ...contrast, ...color })),
);

const ThemeProbe = () => {
  const { theme, contrast } = themeModule.useTheme();
  return <div data-test="theme-probe">{`${contrast} · ${theme}`}</div>;
};

const getProvider = () => {
  const Provider = themeModule.ThemeProvider;
  return (
    <Provider>
      <ThemeProbe />
    </Provider>
  );
};

const renderProvider = () => render(getProvider());

const expectResolvedAppearance = async (
  contrast: 'default' | 'glass' | 'contrast',
  color: 'light' | 'dark',
) => {
  await waitFor(() =>
    expect(screen.getByTestId('theme-probe')).toHaveTextContent(`${contrast} · ${color}`),
  );
  expect(document.documentElement.classList.contains('pf-v6-theme-dark')).toBe(color === 'dark');
  expect(document.documentElement.classList.contains('pf-v6-theme-glass')).toBe(
    contrast === 'glass',
  );
  expect(document.documentElement.classList.contains('pf-v6-theme-high-contrast')).toBe(
    contrast === 'contrast',
  );
  expect(localStorage.getItem('bridge/theme')).toBe(color);
  expect(localStorage.getItem('bridge/contrast')).toBe(contrast);
};

describe('ThemeProvider', () => {
  let preferences: Record<string, string>;

  beforeAll(async () => {
    themeModule = await import('../ThemeProvider');
  });

  beforeEach(() => {
    preferences = {
      'console.theme': 'light',
      'console.theme/contrast': 'default',
    };
    mockUseUserPreference.mockImplementation((key: string) => [
      preferences[key],
      key === 'console.theme' ? setColorScheme : setContrastMode,
      true,
    ]);
    darkMedia.reset();
    contrastMedia.reset();
    document.documentElement.classList.remove(
      'pf-v6-theme-dark',
      'pf-v6-theme-glass',
      'pf-v6-theme-high-contrast',
    );
    localStorage.clear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each(storedSelectionPairs)(
    'should resolve $contrastValue and $colorValue through context without changing preferences',
    async ({ contrastValue, resolvedContrast, colorValue, resolvedColor }) => {
      preferences['console.theme/contrast'] = contrastValue;
      preferences['console.theme'] = colorValue;

      renderProvider();

      await expectResolvedAppearance(resolvedContrast, resolvedColor);
      expect(mockUseUserPreference).toHaveBeenCalledWith('console.theme', 'systemDefault', true);
      expect(mockUseUserPreference).toHaveBeenCalledWith(
        'console.theme/contrast',
        'systemDefault',
        true,
      );
      expect(setColorScheme).not.toHaveBeenCalled();
      expect(setContrastMode).not.toHaveBeenCalled();
    },
  );

  it('should resolve both System defaults from the initial media state', async () => {
    preferences['console.theme'] = 'systemDefault';
    preferences['console.theme/contrast'] = 'systemDefault';
    darkMedia.setMatches(true);
    contrastMedia.setMatches(true);

    renderProvider();

    await expectResolvedAppearance('contrast', 'dark');
    expect(setColorScheme).not.toHaveBeenCalled();
    expect(setContrastMode).not.toHaveBeenCalled();
  });

  it('should update each resolved System default independently on media changes', async () => {
    preferences['console.theme'] = 'systemDefault';
    preferences['console.theme/contrast'] = 'systemDefault';
    renderProvider();
    await expectResolvedAppearance('glass', 'light');

    act(() => darkMedia.change(true));
    await expectResolvedAppearance('glass', 'dark');

    act(() => contrastMedia.change(true));
    await expectResolvedAppearance('contrast', 'dark');

    act(() => darkMedia.change(false));
    await expectResolvedAppearance('contrast', 'light');

    act(() => contrastMedia.change(false));
    await expectResolvedAppearance('glass', 'light');
    expect(setColorScheme).not.toHaveBeenCalled();
    expect(setContrastMode).not.toHaveBeenCalled();
  });

  it('should remove the color media listener and preserve explicit Dark on later media changes', async () => {
    preferences['console.theme'] = 'systemDefault';
    const { rerender } = renderProvider();
    await expectResolvedAppearance('default', 'light');

    preferences['console.theme'] = 'dark';
    rerender(getProvider());

    await expectResolvedAppearance('default', 'dark');
    expect(darkMedia.mediaQuery.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    act(() => darkMedia.change(false));
    await expectResolvedAppearance('default', 'dark');
  });

  it('should remove the contrast media listener and preserve explicit Glass on later media changes', async () => {
    preferences['console.theme/contrast'] = 'systemDefault';
    const { rerender } = renderProvider();
    await expectResolvedAppearance('glass', 'light');

    preferences['console.theme/contrast'] = 'glass';
    rerender(getProvider());

    await expectResolvedAppearance('glass', 'light');
    expect(contrastMedia.mediaQuery.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );

    act(() => contrastMedia.change(true));
    await expectResolvedAppearance('glass', 'light');
  });

  it('should mirror resolved values and remove both media listeners on unmount', async () => {
    preferences['console.theme'] = 'systemDefault';
    preferences['console.theme/contrast'] = 'systemDefault';
    const { unmount } = renderProvider();
    await expectResolvedAppearance('glass', 'light');

    unmount();

    expect(darkMedia.mediaQuery.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
    expect(contrastMedia.mediaQuery.removeEventListener).toHaveBeenCalledWith(
      'change',
      expect.any(Function),
    );
  });
});
