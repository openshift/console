import * as React from 'react';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { THEME_LOCAL_STORAGE_KEY } from './const';
import { usePreferredTheme } from './usePreferredTheme';

enum ThemeTypes {
  light = 'Light',
  dark = 'Dark',
}

const ThemeField: React.FC = () => {
  const { t } = useTranslation();
  const [preferredTheme, setPreferredTheme, preferredThemeLoaded] = usePreferredTheme();
  const [isThemeOpen, setIsThemeOpen] = React.useState<boolean>(false);

  const themeSelectOptions: JSX.Element[] = React.useMemo(
    () =>
      Object.keys(ThemeTypes).map((themeOption) => (
        <SelectOption key={themeOption} value={themeOption}>
          {ThemeTypes[themeOption]}
        </SelectOption>
      )),
    [],
  );

  const onThemeToggle = React.useCallback((isOpen: boolean) => setIsThemeOpen(isOpen), []);

  const onThemeSelect = React.useCallback(
    (_, selection: string) => {
      setPreferredTheme(selection);
      setIsThemeOpen(false);

      const root = document.getElementsByTagName('html')[0];

      if (selection === 'dark') {
        root.classList.add('pf-theme-dark');
      } else {
        root.classList.remove('pf-theme-dark');
      }
      localStorage.setItem(THEME_LOCAL_STORAGE_KEY, selection);
    },
    [setPreferredTheme],
  );

  return (
    <Select
      id="console-theme"
      variant={SelectVariant.single}
      isOpen={isThemeOpen}
      selections={preferredTheme}
      toggleId="console-theme"
      onToggle={onThemeToggle}
      onSelect={onThemeSelect}
      placeholderText={t('console-app~Select theme')}
      isDisabled={!preferredThemeLoaded}
      aria-label={t('console-app~Select theme')}
      maxHeight={300}
    >
      {themeSelectOptions}
    </Select>
  );
};

export default ThemeField;
