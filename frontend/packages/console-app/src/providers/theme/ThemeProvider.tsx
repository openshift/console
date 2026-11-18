import type { FC, ReactNode } from 'react';
import { createContext, useState, useEffect, useMemo, useContext } from 'react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

const THEME_USER_PREFERENCE_KEY = 'console.theme';
const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
const CONTRAST_USER_PREFERENCE_KEY = 'console.theme/contrast';
const CONTRAST_LOCAL_STORAGE_KEY = 'bridge/contrast';
/** Use whatever theme is set by the user at the system level */
const THEME_SYSTEM_DEFAULT = 'systemDefault';
export const THEME_DARK_CLASS = 'pf-v6-theme-dark';
export const THEME_GLASS_CLASS = 'pf-v6-theme-glass';
export const THEME_CONTRAST_CLASS = 'pf-v6-theme-high-contrast';
export const THEME_DARK = 'dark';
export const THEME_LIGHT = 'light';
/** Glass theme (default in OCP 5) */
export const THEME_GLASS = 'glass';
/** High contrast theme */
export const THEME_CONTRAST = 'contrast';
/** PatternFly's default theme, i.e., no high contrast and no glass */
const THEME_DEFAULT = 'default';
export const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
const contrastThemeMq = window.matchMedia('(prefers-contrast: more)');

type ProcessedTheme = typeof THEME_DARK | typeof THEME_LIGHT;
type ProcessedContrast = typeof THEME_CONTRAST | typeof THEME_DEFAULT | typeof THEME_GLASS;

type Theme = {
  theme: ProcessedTheme;
  contrast: ProcessedContrast;
};

const resolveColorTheme = (theme: string, systemPrefersDark: boolean): ProcessedTheme =>
  theme === THEME_DARK || (theme === THEME_SYSTEM_DEFAULT && systemPrefersDark)
    ? THEME_DARK
    : THEME_LIGHT;

const resolveColorContrast = (
  contrast: string,
  systemPrefersContrast: boolean,
): ProcessedContrast => {
  if (contrast === THEME_SYSTEM_DEFAULT) {
    return systemPrefersContrast ? THEME_CONTRAST : THEME_GLASS;
  }
  if (contrast === THEME_CONTRAST || contrast === THEME_GLASS) {
    return contrast;
  }
  return THEME_DEFAULT;
};

const updateColorThemeClass = (htmlTagElement: HTMLElement, theme: ProcessedTheme): void => {
  htmlTagElement.classList.toggle(THEME_DARK_CLASS, theme === THEME_DARK);
};

const updateColorContrastClass = (
  htmlTagElement: HTMLElement,
  contrast: ProcessedContrast,
): void => {
  htmlTagElement.classList.toggle(THEME_GLASS_CLASS, contrast === THEME_GLASS);
  htmlTagElement.classList.toggle(THEME_CONTRAST_CLASS, contrast === THEME_CONTRAST);
};

const ThemeContext = createContext<Theme>({
  theme: THEME_LIGHT,
  contrast: THEME_DEFAULT,
});

interface ThemeProviderProps {
  children?: ReactNode;
}

/** Hook to determine the theme to apply, based on user preference and system settings. */
const useProcessedTheme = () => {
  const [theme, , themeLoaded] = useUserPreference(
    THEME_USER_PREFERENCE_KEY,
    THEME_SYSTEM_DEFAULT,
    true,
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState(darkThemeMq.matches);

  useEffect(() => {
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    darkThemeMq.addEventListener('change', listener);
    return () => darkThemeMq.removeEventListener('change', listener);
  }, []);

  // Until the preference has loaded, fall back to the theme cached by the
  // bootstrap script to avoid a flash of the wrong theme.
  const processedTheme: ProcessedTheme = themeLoaded
    ? resolveColorTheme(theme, systemPrefersDark)
    : (localStorage.getItem(THEME_LOCAL_STORAGE_KEY) as ProcessedTheme);

  useEffect(() => {
    if (themeLoaded) {
      updateColorThemeClass(document.documentElement, processedTheme);
    }
  }, [processedTheme, themeLoaded]);

  // Cache the resolved theme for the bootstrap script's next full page load
  useEffect(() => {
    if (themeLoaded) {
      localStorage.setItem(THEME_LOCAL_STORAGE_KEY, processedTheme);
    }
  }, [processedTheme, themeLoaded]);

  return processedTheme;
};

/**
 * Hook to determine the contrast level to apply, based on user preference
 *
 * OCP 4.x: Always set preference to 'default' (traditional theme)
 * OCP 5.x: Default to 'glass' or 'contrast' based on system settings
 */
const useProcessedContrast = () => {
  const [theme, , themeLoaded] = useUserPreference(
    CONTRAST_USER_PREFERENCE_KEY,
    THEME_SYSTEM_DEFAULT,
    true,
  );
  const [systemPrefersContrast, setSystemPrefersContrast] = useState(contrastThemeMq.matches);

  useEffect(() => {
    const listener = () => setSystemPrefersContrast(contrastThemeMq.matches);
    contrastThemeMq.addEventListener('change', listener);
    return () => contrastThemeMq.removeEventListener('change', listener);
  }, []);

  // Until the preference has loaded, fall back to the contrast level cached
  // by the bootstrap script to avoid a flash of the wrong contrast.
  const processedContrast: ProcessedContrast = themeLoaded
    ? resolveColorContrast(theme, systemPrefersContrast)
    : (localStorage.getItem(CONTRAST_LOCAL_STORAGE_KEY) as ProcessedContrast);

  useEffect(() => {
    if (themeLoaded) {
      updateColorContrastClass(document.documentElement, processedContrast);
    }
  }, [processedContrast, themeLoaded]);

  // Cache the resolved contrast for the bootstrap script's next full page load
  useEffect(() => {
    if (themeLoaded) {
      localStorage.setItem(CONTRAST_LOCAL_STORAGE_KEY, processedContrast);
    }
  }, [processedContrast, themeLoaded]);

  return processedContrast;
};

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const theme = useProcessedTheme();
  const contrast = useProcessedContrast();

  const providerValue = useMemo<Theme>(() => ({ theme, contrast }), [theme, contrast]);

  return <ThemeContext.Provider value={providerValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
