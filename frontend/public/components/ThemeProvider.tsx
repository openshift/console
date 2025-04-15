import * as React from 'react';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';

export const THEME_USER_SETTING_KEY = 'console.theme';
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
const THEME_SYSTEM_DEFAULT = 'systemDefault';
const THEME_DARK_CLASS = 'pf-v6-theme-dark';
const THEME_DARK_CLASS_LEGACY = 'pf-v5-theme-dark'; // legacy class name needed to support PF5
export const THEME_DARK = 'Dark';
export const THEME_LIGHT = 'Light';
export const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');

type PROCESSED_THEME = typeof THEME_DARK | typeof THEME_LIGHT;

export const applyThemeBehaviour = (
  theme: string,
  onDarkBehaviour?: () => string,
  onLightBehaviour?: () => string,
) => {
  if (darkThemeMq.matches && theme === THEME_SYSTEM_DEFAULT) {
    theme = THEME_DARK;
  }
  if (theme === THEME_DARK) {
    return onDarkBehaviour();
  }
  return onLightBehaviour();
};

export const updateThemeClass = (htmlTagElement: HTMLElement, theme: string): PROCESSED_THEME => {
  return applyThemeBehaviour(
    theme,
    () => {
      htmlTagElement.classList.add(THEME_DARK_CLASS);
      htmlTagElement.classList.add(THEME_DARK_CLASS_LEGACY);
      return THEME_DARK;
    },
    () => {
      htmlTagElement.classList.remove(THEME_DARK_CLASS);
      htmlTagElement.classList.remove(THEME_DARK_CLASS_LEGACY);
      return THEME_LIGHT;
    },
  ) as PROCESSED_THEME;
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
    if (theme === THEME_SYSTEM_DEFAULT) {
      darkThemeMq.addEventListener('change', mqListener);
    }
    if (themeLoaded) {
      setProcessedTheme(updateThemeClass(htmlTagElement, theme));
    }
    return () => darkThemeMq.removeEventListener('change', mqListener);
  }, [htmlTagElement, mqListener, theme, themeLoaded]);

  React.useEffect(() => {
    themeLoaded && localStorage.setItem(THEME_LOCAL_STORAGE_KEY, theme);
  }, [theme, themeLoaded]);

  return <ThemeContext.Provider value={processedTheme}>{children}</ThemeContext.Provider>;
};
