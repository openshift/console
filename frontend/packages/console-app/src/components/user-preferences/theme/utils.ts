import { THEME_LOCAL_STORAGE_KEY } from './const';

export const updateThemeClass = (htmlTagElement, theme, themeLoaded) => {
  const localTheme = localStorage.getItem(THEME_LOCAL_STORAGE_KEY);

  if ((!themeLoaded && localTheme === 'dark') || (themeLoaded && theme === 'dark')) {
    htmlTagElement.classList.add('pf-theme-dark');
  } else {
    htmlTagElement.classList.remove('pf-theme-dark');
  }
};
