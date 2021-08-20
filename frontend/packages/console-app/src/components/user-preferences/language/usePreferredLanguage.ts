import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';

const PREFERRED_LANGUAGE_USER_SETTING_KEY = 'console.preferredLanguage';
const PREFERRED_LANGUAGE_LOCAL_STORAGE_KEY = 'bridge/language';

export const usePreferredLanguage = (): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  boolean,
] =>
  useUserSettingsCompatibility<string>(
    PREFERRED_LANGUAGE_USER_SETTING_KEY,
    PREFERRED_LANGUAGE_LOCAL_STORAGE_KEY,
  );
