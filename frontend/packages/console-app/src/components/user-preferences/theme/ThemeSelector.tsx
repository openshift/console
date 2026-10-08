import type { FC } from 'react';
import { useEffect, useState } from 'react';
import {
  Divider,
  MenuToggle,
  Popover,
  PopoverPosition,
  Skeleton,
  Title,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { FLAG_OPENSHIFT_5 } from '@console/app/src/consts';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import {
  CONTRAST_USER_PREFERENCE_KEY,
  THEME_DEFAULT,
  THEME_SYSTEM_DEFAULT,
  THEME_USER_PREFERENCE_KEY,
} from '../../../providers/theme/theme-constants';

import './ThemeSelector.scss';

const COLOR_SCHEMES = ['light', 'dark', THEME_SYSTEM_DEFAULT] as const;
const CONTRAST_MODES = [THEME_DEFAULT, 'glass', 'contrast', THEME_SYSTEM_DEFAULT] as const;

type ColorScheme = (typeof COLOR_SCHEMES)[number];
type ContrastMode = (typeof CONTRAST_MODES)[number];

const isColorScheme = (value: string): value is ColorScheme =>
  COLOR_SCHEMES.includes(value as ColorScheme);

const isContrastMode = (value: string): value is ContrastMode =>
  CONTRAST_MODES.includes(value as ContrastMode);

const ThemeSelector: FC = () => {
  const { t } = useTranslation('console-app');
  const isOpenShift5 = useFlag(FLAG_OPENSHIFT_5);
  const fireTelemetryEvent = useTelemetry();
  const [isOpen, setIsOpen] = useState(false);
  const [colorScheme, setColorScheme, colorSchemeLoaded] = useUserPreference<string>(
    THEME_USER_PREFERENCE_KEY,
    THEME_SYSTEM_DEFAULT,
    true,
  );
  const [contrastMode, setContrastMode, contrastModeLoaded] = useUserPreference<string>(
    CONTRAST_USER_PREFERENCE_KEY,
    THEME_SYSTEM_DEFAULT,
    true,
  );

  const selectedColorScheme = isColorScheme(colorScheme) ? colorScheme : THEME_SYSTEM_DEFAULT;
  const selectedContrastMode = isContrastMode(contrastMode) ? contrastMode : THEME_SYSTEM_DEFAULT;
  const loaded = colorSchemeLoaded && (!isOpenShift5 || contrastModeLoaded);

  useEffect(() => {
    if (colorSchemeLoaded && !isColorScheme(colorScheme)) {
      setColorScheme(THEME_SYSTEM_DEFAULT);
    }
  }, [colorScheme, colorSchemeLoaded, setColorScheme]);

  useEffect(() => {
    if (isOpenShift5 && contrastModeLoaded && !isContrastMode(contrastMode)) {
      setContrastMode(THEME_SYSTEM_DEFAULT);
    }
  }, [contrastMode, contrastModeLoaded, isOpenShift5, setContrastMode]);

  const getColorSchemeLabel = (value: ColorScheme): string => {
    switch (value) {
      case 'light':
        return t('Light');
      case 'dark':
        return t('Dark');
      default:
        return t('System default');
    }
  };

  const getContrastModeLabel = (value: ContrastMode): string => {
    switch (value) {
      case 'default':
        return t('Traditional');
      case 'glass':
        return t('Glass');
      case 'contrast':
        return t('High contrast');
      default:
        return t('System default');
    }
  };

  const colorSchemeLabel = getColorSchemeLabel(selectedColorScheme);
  const contrastModeLabel = getContrastModeLabel(selectedContrastMode);
  const summary = isOpenShift5
    ? t('{{contrastMode}} · {{colorScheme}}', {
        contrastMode: contrastModeLabel,
        colorScheme: colorSchemeLabel,
      })
    : colorSchemeLabel;

  const selectColorScheme = (value: ColorScheme) => {
    if (value !== selectedColorScheme) {
      setColorScheme(value);
      fireTelemetryEvent('User Preference Changed', {
        property: THEME_USER_PREFERENCE_KEY,
        value,
      });
    }
  };

  const selectContrastMode = (value: ContrastMode) => {
    if (value !== selectedContrastMode) {
      setContrastMode(value);
      fireTelemetryEvent('User Preference Changed', {
        property: CONTRAST_USER_PREFERENCE_KEY,
        value,
      });
    }
  };

  if (!loaded) {
    return <Skeleton height="30px" width="100%" data-test="select skeleton console.theme" />;
  }

  const panelId = 'console-theme-panel';
  const initialFocusId = isOpenShift5 ? '#theme-contrast-default' : '#theme-color-light';

  return (
    <Popover
      aria-label={t('Theme')}
      bodyContent={
        <div className="co-theme-selector__content" data-test="theme-selector-panel" id={panelId}>
          {isOpenShift5 && (
            <div className="co-theme-selector__section" data-test="console.theme/contrast field">
              <Title headingLevel="h3" size="md">
                {t('Contrast mode')}
              </Title>
              <ToggleGroup
                aria-label={t('Contrast mode')}
                className="co-theme-selector__toggle-group"
                isCompact
              >
                {CONTRAST_MODES.map((value) => (
                  <ToggleGroupItem
                    buttonId={`theme-contrast-${value}`}
                    isSelected={selectedContrastMode === value}
                    key={value}
                    onChange={(_event, selected) => selected && selectContrastMode(value)}
                    text={getContrastModeLabel(value)}
                  />
                ))}
              </ToggleGroup>
            </div>
          )}
          {isOpenShift5 && <Divider />}
          <div className="co-theme-selector__section" data-test="console.theme/color-scheme field">
            <Title headingLevel="h3" size="md">
              {t('Color scheme')}
            </Title>
            <ToggleGroup
              aria-label={t('Color scheme')}
              className="co-theme-selector__toggle-group"
              isCompact
            >
              {COLOR_SCHEMES.map((value) => (
                <ToggleGroupItem
                  buttonId={`theme-color-${value}`}
                  isSelected={selectedColorScheme === value}
                  key={value}
                  onChange={(_event, selected) => selected && selectColorScheme(value)}
                  text={getColorSchemeLabel(value)}
                />
              ))}
            </ToggleGroup>
          </div>
        </div>
      }
      className="co-theme-selector__popover"
      elementToFocus={initialFocusId}
      hasNoPadding
      id="console-theme"
      maxWidth="calc(100vw - (2 * var(--pf-t--global--spacer--md)))"
      minWidth="trigger"
      onHide={() => setIsOpen(false)}
      onShow={() => setIsOpen(true)}
      position={PopoverPosition.bottomStart}
      showClose={false}
      withFocusTrap
    >
      <MenuToggle
        aria-controls={panelId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-label={t('Theme: {{summary}}', { summary })}
        className="co-theme-selector__toggle"
        data-test="theme-selector-toggle"
        id="console.theme"
        isExpanded={isOpen}
        isFullWidth
      >
        {summary}
      </MenuToggle>
    </Popover>
  );
};

export default ThemeSelector;
