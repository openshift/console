import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

export const PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_VALUE_LATEST = 'latest';
const PREFERRED_CREATE_EDIT_METHOD_USER_PREFERENCE_KEY = 'console.preferredCreateEditMethod';

export const usePreferredCreateEditMethod = (): [string, boolean] => {
  const [preferredCreateEditMethod, , preferredCreateEditMethodLoaded] = useUserPreference<string>(
    PREFERRED_CREATE_EDIT_METHOD_USER_PREFERENCE_KEY,
  );
  return [preferredCreateEditMethod, preferredCreateEditMethodLoaded];
};
