import type { FC, ReactNode } from 'react';
import { createContext, useState, useCallback, useEffect, useMemo, useContext } from 'react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

export const THEME_USER_PREFERENCE_KEY = 'console.theme';
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
const THEME_SYSTEM_DEFAULT = 'systemDefault';
const THEME_DARK_CLASS = 'pf-v6-theme-dark';
export const THEME_DARK = 'dark';
export const THEME_LIGHT = 'light';
export const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');

type PROCESSED_THEME = typeof THEME_DARK | typeof THEME_LIGHT;

type Theme = {
  theme: PROCESSED_THEME;
};

export const updateThemeClass = (htmlTagElement: HTMLElement, theme: string): PROCESSED_THEME => {
  if (darkThemeMq.matches && theme === THEME_SYSTEM_DEFAULT) {
    theme = THEME_DARK;
  }
  if (theme === THEME_DARK) {
    htmlTagElement.classList.add(THEME_DARK_CLASS);
    return THEME_DARK;
  }
  htmlTagElement.classList.remove(THEME_DARK_CLASS);
  return THEME_LIGHT;
};

export const ThemeContext = createContext<Theme>({
  theme: THEME_LIGHT,
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
    const resolved = updateThemeClass(document.documentElement, isDark ? THEME_DARK : THEME_LIGHT);
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

export const ThemeProvider: FC<ThemeProviderProps> = ({ children }) => {
  const processedTheme = useProcessedTheme();

  const providerValue = useMemo<Theme>(() => {
    return {
      theme: processedTheme,
    };
  }, [processedTheme]);

  return <ThemeContext.Provider value={providerValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
