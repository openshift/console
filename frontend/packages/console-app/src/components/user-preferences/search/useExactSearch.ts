import { useUserSettings } from '@console/shared';

const PREFERRED_EXACT_SEARCH_USER_SETTING_KEY: string = 'console.enableExactSearch';

export const useExactSearch = (): [boolean, boolean] => {
  const [exactSearch, , exactSearchLoaded] = useUserSettings<boolean>(
    PREFERRED_EXACT_SEARCH_USER_SETTING_KEY,
  );
  return [exactSearch, exactSearchLoaded];
};
