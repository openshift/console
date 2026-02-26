import type { SetStateAction, Dispatch } from 'react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

export const PREFERRED_LANGUAGE_USER_SETTING_KEY = 'console.preferredLanguage';

export const usePreferredLanguage = (): [string, Dispatch<SetStateAction<string>>, boolean] =>
  useUserPreference<string>(PREFERRED_LANGUAGE_USER_SETTING_KEY, '', true);
