import * as React from 'react';
import { useLanguage } from '../user-preferences/language/useLanguage';
import { usePreferredLanguage } from '../user-preferences/language/usePreferredLanguage';

const DetectLanguage: React.MemoExoticComponent<() => any> = React.memo(function DetectLanguage() {
  const [preferredLanguage, , preferredLanguageLoaded] = usePreferredLanguage();
  useLanguage(preferredLanguage, preferredLanguageLoaded);
  return null;
});

export default DetectLanguage;
