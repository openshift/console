import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

const PREFERRED_EXACT_SEARCH_USER_PREFERENCE_KEY: string = 'console.enableExactSearch';

export const useExactSearch = (): [boolean, boolean] => {
  const [exactSearch, , exactSearchLoaded] = useUserPreference<boolean>(
    PREFERRED_EXACT_SEARCH_USER_PREFERENCE_KEY,
  );
  return [exactSearch, exactSearchLoaded];
};
