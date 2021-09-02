import * as React from 'react';
import { QuickStartContext, QuickStartContextValues } from '@patternfly/quickstarts';
import { useTranslation } from 'react-i18next';
import { getProcessedResourceBundle } from '../../quick-starts/utils/quick-start-context';
import { LAST_LANGUAGE_LOCAL_STORAGE_KEY } from './const';
import { getLastLanguage } from './getLastLanguage';

export const useLanguage = (preferredLanguage: string, preferredLanguageLoaded: boolean) => {
  const { i18n } = useTranslation();
  const { setResourceBundle } = React.useContext<QuickStartContextValues>(QuickStartContext);

  React.useEffect(() => {
    const onLanguageChange = (lng: string) => {
      if (setResourceBundle) {
        // Update language resource of quick starts components
        const resourceBundle = i18n.getResourceBundle(lng, 'console-app');
        const processedBundle = getProcessedResourceBundle(resourceBundle, lng);
        setResourceBundle(processedBundle, lng);
      }
    };
    const preferredLanguageInStorage: string = getLastLanguage();

    i18n.on('languageChanged', onLanguageChange);

    if (preferredLanguageLoaded && preferredLanguage !== preferredLanguageInStorage) {
      if (preferredLanguage) {
        localStorage.setItem(LAST_LANGUAGE_LOCAL_STORAGE_KEY, preferredLanguage);
        i18n.changeLanguage(preferredLanguage);
      } else {
        preferredLanguageInStorage && localStorage.removeItem(LAST_LANGUAGE_LOCAL_STORAGE_KEY);
      }
    }

    return () => {
      i18n.off('languageChanged', onLanguageChange);
    };
  }, [i18n, preferredLanguage, preferredLanguageLoaded, setResourceBundle]);
};
