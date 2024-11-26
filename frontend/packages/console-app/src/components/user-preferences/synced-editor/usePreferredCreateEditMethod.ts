import { useUserSettings } from '@console/shared';

export const PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_VALUE_LATEST = 'latest';
const PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_KEY = 'console.preferredCreateEditMethod';

export const usePreferredCreateEditMethod = (): [string, boolean] => {
  const [preferredCreateEditMethod, , preferredCreateEditMethodLoaded] = useUserSettings<string>(
    PREFERRED_CREATE_EDIT_METHOD_USER_SETTING_KEY,
  );
  return [preferredCreateEditMethod, preferredCreateEditMethodLoaded];
};
