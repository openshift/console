import type { FC, ReactNode } from 'react';
import { createContext, useState, useCallback, useEffect, useMemo, useContext } from 'react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { IS_OPENSHIFT_5 } from '@console/app/src/features/openshift5';

export const THEME_USER_PREFERENCE_KEY = 'console.theme';
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
export const CONTRAST_USER_PREFERENCE_KEY = 'console.theme/contrast';
export const CONTRAST_LOCAL_STORAGE_KEY = 'bridge/contrast';
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
export const THEME_DEFAULT = 'default';
export const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
export const contrastThemeMq = window.matchMedia('(prefers-contrast: more)');

/** This will never change because it's applied on the server-side */
const IS_UNIFIED_THEME = document.documentElement.classList.contains('pf-v6-theme-redhat');

type PROCESSED_THEME = typeof THEME_DARK | typeof THEME_LIGHT;
type PROCESSED_CONTRAST = typeof THEME_CONTRAST | typeof THEME_DEFAULT | typeof THEME_GLASS;

type Theme = {
  theme: PROCESSED_THEME;
  contrast: PROCESSED_CONTRAST;
  redHat: boolean;
};

const updateColorThemeClass = (htmlTagElement: HTMLElement, theme: string): PROCESSED_THEME => {
  const isDarkTheme = theme === THEME_SYSTEM_DEFAULT ? darkThemeMq.matches : theme === THEME_DARK;
  htmlTagElement.classList.toggle(THEME_DARK_CLASS, isDarkTheme);
  return isDarkTheme ? THEME_DARK : THEME_LIGHT;
};

const updateColorContrastClass = (
  htmlTagElement: HTMLElement,
  contrast: string,
): PROCESSED_CONTRAST => {
  let resolvedContrast: PROCESSED_CONTRAST = THEME_DEFAULT;

  // Glass and contrast is an OCP 5-exclusive feature
  if (IS_OPENSHIFT_5) {
    if (contrast === THEME_SYSTEM_DEFAULT) {
      resolvedContrast = contrastThemeMq.matches ? THEME_CONTRAST : THEME_GLASS;
    }
    if (contrast === THEME_CONTRAST || contrast === THEME_GLASS) {
      resolvedContrast = contrast;
    }
  }

  htmlTagElement.classList.toggle(THEME_GLASS_CLASS, resolvedContrast === THEME_GLASS);
  htmlTagElement.classList.toggle(THEME_CONTRAST_CLASS, resolvedContrast === THEME_CONTRAST);

  return resolvedContrast;
};

export const ThemeContext = createContext<Theme>({
  theme: THEME_LIGHT,
  contrast: THEME_DEFAULT,
  redHat: IS_UNIFIED_THEME,
});

interface ThemeProviderProps {
  children?: ReactNode;
}

/** Hook to determine the theme to apply, based on user preference and system settings. */
const useProcessedTheme = () => {
  const localTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY) as PROCESSED_THEME;
  const [theme, , themeLoaded] = useUserPreference(
    THEME_USER_PREFERENCE_KEY,
    THEME_SYSTEM_DEFAULT,
    true,
  );
  const [processedTheme, setProcessedTheme] = useState<PROCESSED_THEME>(localTheme);

  const applyTheme = useCallback((isDark: boolean) => {
    const resolved = updateColorThemeClass(
      document.documentElement,
      isDark ? THEME_DARK : THEME_LIGHT,
    );
    setProcessedTheme(resolved);
  }, []);

  useEffect(() => {
    if (!themeLoaded) {
      return;
    }

    if (theme === THEME_SYSTEM_DEFAULT) {
      applyTheme(darkThemeMq.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      darkThemeMq.addEventListener('change', listener);
      return () => darkThemeMq.removeEventListener('change', listener);
    }

    applyTheme(theme === THEME_DARK);
  }, [applyTheme, theme, themeLoaded]);

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
  const localContrast = localStorage.getItem(CONTRAST_LOCAL_STORAGE_KEY) as PROCESSED_CONTRAST;
  const [theme, , themeLoaded] = useUserPreference(
    CONTRAST_USER_PREFERENCE_KEY,
    THEME_SYSTEM_DEFAULT,
    true,
  );
  const [processedContrast, setProcessedContrast] = useState<PROCESSED_CONTRAST>(localContrast);

  const applyTheme = useCallback((contrastLevel: string) => {
    const resolved = updateColorContrastClass(document.documentElement, contrastLevel);
    setProcessedContrast(resolved);
  }, []);

  useEffect(() => {
    if (!themeLoaded) {
      return;
    }

    if (theme === THEME_SYSTEM_DEFAULT) {
      applyTheme(theme);
      const listener = () => applyTheme(theme);
      contrastThemeMq.addEventListener('change', listener);
      return () => contrastThemeMq.removeEventListener('change', listener);
    }

    applyTheme(theme);
  }, [applyTheme, theme, themeLoaded]);

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

  const providerValue = useMemo<Theme>(() => ({ theme, contrast, redHat: IS_UNIFIED_THEME }), [
    theme,
    contrast,
  ]);

  return <ThemeContext.Provider value={providerValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
