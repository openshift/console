import { memo } from 'react';
import { useLanguage } from '../user-preferences/language/useLanguage';
import { usePreferredLanguage } from '../user-preferences/language/usePreferredLanguage';

const DetectLanguage = memo(() => {
  const [preferredLanguage, , preferredLanguageLoaded] = usePreferredLanguage();
  useLanguage(preferredLanguage, preferredLanguageLoaded);
  return null;
});

export default DetectLanguage;
