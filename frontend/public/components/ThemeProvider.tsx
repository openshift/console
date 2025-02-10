import * as React from 'react';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';

export const THEME_USER_SETTING_KEY = 'console.theme';
export const THEME_LOCAL_STORAGE_KEY = 'bridge/theme';
export const THEME_SYSTEM_DEFAULT = 'systemDefault';
const THEME_DARK_CLASS = 'pf-v6-theme-dark';
const THEME_DARK_CLASS_LEGACY = 'pf-v5-theme-dark'; // legacy class name needed to support PF5
export const THEME_DARK = 'dark';
export const THEME_LIGHT = 'light';

type PROCESSED_THEME = typeof THEME_DARK | typeof THEME_LIGHT;

export const applyThemeBehaviour = (
  theme: string,
  onDarkBehaviour?: () => any,
  onLightBehaviour?: () => any,
) => {
  let systemTheme: string;
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    systemTheme = THEME_DARK;
  }
  if (theme === THEME_DARK || (theme === THEME_SYSTEM_DEFAULT && systemTheme === THEME_DARK)) {
    return onDarkBehaviour();
  }
  return onLightBehaviour();
};

export const updateThemeClass = (htmlTagElement: HTMLElement, theme: string) => {
  applyThemeBehaviour(
    theme,
    () => {
      htmlTagElement.classList.add(THEME_DARK_CLASS);
      htmlTagElement.classList.add(THEME_DARK_CLASS_LEGACY);
    },
    () => {
      htmlTagElement.classList.remove(THEME_DARK_CLASS);
      htmlTagElement.classList.remove(THEME_DARK_CLASS_LEGACY);
    },
  );
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
