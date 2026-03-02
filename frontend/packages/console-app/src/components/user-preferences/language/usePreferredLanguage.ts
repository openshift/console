import type { SetStateAction, Dispatch } from 'react';
import { useUserPreferenceCompatibility } from '@console/shared/src/hooks/useUserPreferenceCompatibility';

export const PREFERRED_LANGUAGE_USER_SETTING_KEY = 'console.preferredLanguage';
const PREFERRED_LANGUAGE_LOCAL_STORAGE_KEY = 'bridge/language';

export const usePreferredLanguage = (): [string, Dispatch<SetStateAction<string>>, boolean] =>
  useUserPreferenceCompatibility<string>(
    PREFERRED_LANGUAGE_USER_SETTING_KEY,
    PREFERRED_LANGUAGE_LOCAL_STORAGE_KEY,
    '',
    true,
  );
