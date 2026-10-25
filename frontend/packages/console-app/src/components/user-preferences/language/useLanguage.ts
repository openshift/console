import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuickStartContext } from '@console/shared/src/hooks/useQuickStartContext';
import { getProcessedResourceBundle } from '../../quick-starts/utils/quick-start-context';
import { LAST_LANGUAGE_LOCAL_STORAGE_KEY } from './const';
import { getLastLanguage } from './getLastLanguage';

export const useLanguage = (preferredLanguage: string, preferredLanguageLoaded: boolean) => {
  const { i18n } = useTranslation('console-app');
  const { setResourceBundle } = useQuickStartContext();

  useEffect(() => {
    const onLanguageChange = () => {
      if (setResourceBundle) {
        // Update language resource of quick starts components
        const language = i18n.resolvedLanguage || 'en';
        const resourceBundle = i18n.getResourceBundle(language, 'console-app') ?? {};
        const processedBundle = getProcessedResourceBundle(resourceBundle, language);
        setResourceBundle(processedBundle, language);
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
