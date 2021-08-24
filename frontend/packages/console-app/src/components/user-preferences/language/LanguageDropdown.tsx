import * as React from 'react';
import { QuickStartContext, QuickStartContextValues } from '@patternfly/quickstarts';
import { Skeleton, SelectOption, Select, SelectVariant } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { getProcessedResourceBundle } from '../../quick-starts/utils/quick-start-context';
import { supportedLocales } from './const';
import { usePreferredLanguage } from './usePreferredLanguage';

const LanguageDropdown: React.FC = () => {
  const { i18n, t } = useTranslation();
  const { setResourceBundle } = React.useContext<QuickStartContextValues>(QuickStartContext);
  const [preferredLanguage, setPreferredLanguage, preferredLanguageLoaded] = usePreferredLanguage();
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const selectOptions: JSX.Element[] = React.useMemo(
    () =>
      Object.keys(supportedLocales).map((lang) => (
        <SelectOption key={lang} value={lang}>
          {supportedLocales[lang]}
        </SelectOption>
      )),
    [],
  );

  const selectedLanguage =
    preferredLanguage ||
    // handles languages we support, languages we don't support, and subsets of languages we support (such as en-us, zh-cn, etc.)
    i18n.languages.find((lang) => supportedLocales[lang]);

  const onToggle = (isOpen: boolean) => setDropdownOpen(isOpen);
  const onSelect = (_, selection: string) => {
    if (selection !== preferredLanguage) {
      i18n.changeLanguage(selection);
      setPreferredLanguage(selection);
    }
    setDropdownOpen(false);
  };

  React.useEffect(() => {
    const onLanguageChange = (lng: string) => {
      // Update language resource of quick starts components
      const resourceBundle = i18n.getResourceBundle(lng, 'console-app');
      const processedBundle = getProcessedResourceBundle(resourceBundle, lng);
      setResourceBundle(processedBundle, lng);
    };
    i18n.on('languageChanged', onLanguageChange);

    return () => {
      i18n.off('languageChanged', onLanguageChange);
    };
  });

  return preferredLanguageLoaded ? (
    <Select
      variant={SelectVariant.single}
      isOpen={dropdownOpen}
      selections={selectedLanguage}
      toggleId={'console.preferredLanguage'}
      onToggle={onToggle}
      onSelect={onSelect}
      placeholderText={t('console-app~Select a language')}
      data-test={'dropdown console.preferredLanguage'}
      maxHeight={300}
    >
      {selectOptions}
    </Select>
  ) : (
    <Skeleton
      height="30px"
      width="100%"
      data-test={'dropdown skeleton console.preferredLanguage'}
    />
  );
};

export default LanguageDropdown;
