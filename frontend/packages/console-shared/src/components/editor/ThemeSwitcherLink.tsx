import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { CODE_EDITOR_THEME_USERSETTINGS_KEY, useUserSettings } from '@console/shared';

const ThemeSwitcherLink: React.FC = () => {
  const { t } = useTranslation();
  const [preferredTheme, setPreferredTheme, preferredThemeLoaded] = useUserSettings<
    'console-dark' | 'console-light'
  >(CODE_EDITOR_THEME_USERSETTINGS_KEY, 'console-dark', true);

  const switchTheme = () => {
    if (preferredTheme === 'console-dark') {
      setPreferredTheme('console-light');
    } else {
      setPreferredTheme('console-dark');
    }
  };

  if (!preferredThemeLoaded) {
    return <></>;
  }

  return (
    <Button type="button" variant="link" isInline onClick={switchTheme}>
      {preferredTheme === 'console-dark' && (
        <>
          <i
            className="fas fa-sun co-icon-space-r co-p-has-sidebar__sidebar-link-icon"
            aria-hidden="true"
          />
          {t('console-shared~Switch to light theme')}
        </>
      )}
      {preferredTheme !== 'console-dark' && (
        <>
          <i
            className="fas fa-moon co-icon-space-r co-p-has-sidebar__sidebar-link-icon"
            aria-hidden="true"
          />
          {t('console-shared~Switch to dark theme')}
        </>
      )}
    </Button>
  );
};

export default ThemeSwitcherLink;
