import * as React from 'react';
import { useUserSettings } from '@console/shared';

export const THEME_USER_SETTING_KEY = 'console.theme';
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
const THEME_SYSTEM_DEFAULT = 'systemDefault';
const THEME_DARK_CLASS = 'pf-theme-dark';
const THEME_DARK = 'dark';

export const updateThemeClass = (htmlTagElement: HTMLElement, theme: string) => {
  let systemTheme: string;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    systemTheme = THEME_DARK;
  }
  if (theme === THEME_DARK || (theme === THEME_SYSTEM_DEFAULT && systemTheme === THEME_DARK)) {
    htmlTagElement.classList.add(THEME_DARK_CLASS);
  } else {
    htmlTagElement.classList.remove(THEME_DARK_CLASS);
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
  const mqListener = React.useCallback(
    (e) => {
      if (e.matches) {
        htmlTagElement?.classList.add(THEME_DARK_CLASS);
      } else {
        htmlTagElement?.classList.remove(THEME_DARK_CLASS);
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
  }, [theme, themeLoaded]);

  const value = themeLoaded ? theme : localTheme;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
