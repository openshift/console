import * as React from 'react';
import {
  Skeleton,
  Checkbox,
  Select,
  SelectList,
  SelectOption,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { supportedLocales } from './const';
import { useLanguage } from './useLanguage';
import { PREFERRED_LANGUAGE_USER_SETTING_KEY, usePreferredLanguage } from './usePreferredLanguage';

import './LanguageDropdown.scss';

const LanguageDropdown: React.FC = () => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [preferredLanguage, setPreferredLanguage, preferredLanguageLoaded] = usePreferredLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const options: JSX.Element[] = React.useMemo(
    () =>
      Object.keys(supportedLocales).map((language) => (
        <SelectOption key={language} value={language}>
          {supportedLocales[language]}
        </SelectOption>
      )),
    [],
  );

  const [isUsingDefault, setIsUsingDefault] = React.useState<boolean>(!preferredLanguage);
  const checkboxLabel: string = t('console-app~Use the default browser language setting.');

  const onSelect = (_, selection: string) => {
    if (selection !== preferredLanguage) {
      setPreferredLanguage(selection);
      fireTelemetryEvent('User Preference Changed', {
        property: PREFERRED_LANGUAGE_USER_SETTING_KEY,
        value: 'custom',
      });
    }
    setIsOpen(false);
  };

  const onUsingDefault = (_event, checked: boolean) => {
    setIsUsingDefault(checked);
    fireTelemetryEvent('User Preference Changed', {
      property: PREFERRED_LANGUAGE_USER_SETTING_KEY,
      value: checked,
    });
    if (checked) {
      setPreferredLanguage(null);
    }
  };

  useLanguage(preferredLanguage, preferredLanguageLoaded); // sync the preferred language with local storage and set the console language

  React.useEffect(() => {
    if (preferredLanguageLoaded) {
      setIsUsingDefault(!preferredLanguage);
    }
    // run this hook only after resources have loaded
    // to set the using default language checkbox when the form loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredLanguageLoaded]);

  return preferredLanguageLoaded ? (
    <>
      <Checkbox
        id="default-language-checkbox"
        label={checkboxLabel}
        isChecked={isUsingDefault}
        data-checked-state={isUsingDefault}
        onChange={onUsingDefault}
        aria-label={checkboxLabel}
        data-test="checkbox console.preferredLanguage"
        className="co-language-dropdown__system-default-checkbox"
      />
      <Select
        isOpen={isOpen}
        onOpenChange={(open) => setIsOpen(open)}
        selected={preferredLanguage}
        onSelect={onSelect}
        data-test="dropdown console.preferredLanguage"
        id={'console.preferredLanguage'}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            aria-label={t('console-app~Select a language')}
            isFullWidth
            isDisabled={isUsingDefault}
            ref={toggleRef}
            onClick={(open) => setIsOpen(open)}
          >
            {supportedLocales[preferredLanguage] || t('console-app~Select a language')}
          </MenuToggle>
        )}
      >
        <SelectList>{options}</SelectList>
      </Select>
    </>
  ) : (
    <>
      <Skeleton
        height="15px"
        width="100%"
        data-test="checkbox skeleton console.preferredLanguage"
        className="co-language-dropdown__system-default-checkbox"
      />
      <Skeleton
        height="30px"
        width="100%"
        data-test="dropdown skeleton console.preferredLanguage"
      />
    </>
  );
};

export default LanguageDropdown;
