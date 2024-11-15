import * as React from 'react';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';

export const THEME_USER_SETTING_KEY = 'console.theme';
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
const THEME_SYSTEM_DEFAULT = 'systemDefault';
const THEME_DARK_CLASS = 'pf-v5-theme-dark';
const THEME_DARK_CLASS_LEGACY = 'pf-theme-dark'; // legacy class name needed to support PF4
const THEME_DARK = 'dark';
const THEME_LIGHT = 'light';

type PROCESSED_THEME = typeof THEME_DARK | typeof THEME_LIGHT;

export const updateThemeClass = (htmlTagElement: HTMLElement, theme: string) => {
  let systemTheme: string;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    systemTheme = THEME_DARK;
  }
  if (theme === THEME_DARK || (theme === THEME_SYSTEM_DEFAULT && systemTheme === THEME_DARK)) {
    htmlTagElement.classList.add(THEME_DARK_CLASS);
    htmlTagElement.classList.add(THEME_DARK_CLASS_LEGACY);
  } else {
    htmlTagElement.classList.remove(THEME_DARK_CLASS);
    htmlTagElement.classList.remove(THEME_DARK_CLASS_LEGACY);
  }
};

export const ThemeContext = React.createContext<string>('');

export const ThemeProvider: React.FC<{}> = ({ children }) => {
  const htmlTagElement = document.documentElement;
  const localTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);
  const [theme, , themeLoaded] = useUserSettings(
    THEME_USER_SETTING_KEY,
    THEME_SYSTEM_DEFAULT,
    true,
  );
  const [processedTheme, setProcessedTheme] = React.useState<PROCESSED_THEME>(
    localTheme as PROCESSED_THEME,
  );

  const mqListener = React.useCallback(
    (e) => {
      if (e.matches) {
        htmlTagElement?.classList.add(THEME_DARK_CLASS);
        htmlTagElement?.classList.add(THEME_DARK_CLASS_LEGACY);
        setProcessedTheme(THEME_DARK);
      } else {
        htmlTagElement?.classList.remove(THEME_DARK_CLASS);
        htmlTagElement?.classList.remove(THEME_DARK_CLASS_LEGACY);
        setProcessedTheme(THEME_LIGHT);
      }
    },
    [htmlTagElement],
  );

  React.useEffect(() => {
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
    if (theme === THEME_SYSTEM_DEFAULT) {
      darkThemeMq.addEventListener('change', mqListener);
    }
    if (themeLoaded) {
      updateThemeClass(htmlTagElement, theme);
    }
    return () => darkThemeMq.removeEventListener('change', mqListener);
  }, [htmlTagElement, mqListener, theme, themeLoaded]);

  React.useEffect(() => {
    themeLoaded && localStorage.setItem(THEME_LOCAL_STORAGE_KEY, theme);
    themeLoaded && setProcessedTheme(theme as PROCESSED_THEME);
  }, [theme, themeLoaded]);

  return <ThemeContext.Provider value={processedTheme}>{children}</ThemeContext.Provider>;
};
