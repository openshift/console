import * as React from 'react';
import { usePreferredLanguage, useLanguage } from '../user-preferences/language';

const DetectLanguage: React.MemoExoticComponent<() => any> = React.memo(() => {
  const [preferredLanguage, , preferredLanguageLoaded] = usePreferredLanguage();
  useLanguage(preferredLanguage, preferredLanguageLoaded);
  return null;
});

export default DetectLanguage;
