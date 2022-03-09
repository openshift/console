import * as React from 'react';
import { useUserSettings } from '@console/shared';

export const THEME_USER_SETTING_KEY = 'console.theme';
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
const THEME_SYSTEM_DEFAULT = 'systemDefault';
const THEME_DARK_CLASS = 'pf-theme-dark';

export const updateThemeClass = (htmlTagElement: HTMLElement, theme: string) => {
  let systemTheme: string;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    systemTheme = 'dark';
  }
  if (theme === 'dark' || (theme === THEME_SYSTEM_DEFAULT && systemTheme === 'dark')) {
    htmlTagElement?.classList.add(THEME_DARK_CLASS);
  } else {
    htmlTagElement?.classList.remove(THEME_DARK_CLASS);
  }
};

export const ThemeProvider = () => {
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
        htmlTagElement?.classList.add(THEME_DARK_CLASS);
      }
    },
    [htmlTagElement],
  );
  React.useEffect(() => {
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
    if (theme === THEME_SYSTEM_DEFAULT) {
      darkThemeMq.addListener(mqListener);
    }
    if (themeLoaded) {
      updateThemeClass(htmlTagElement, theme);
    }
    return () => darkThemeMq.removeListener(mqListener);
  }, [htmlTagElement, localTheme, mqListener, theme, themeLoaded]);

  React.useEffect(() => {
    themeLoaded && localStorage.setItem(THEME_LOCAL_STORAGE_KEY, theme);
  }, [theme, themeLoaded]);
  return null;
};
