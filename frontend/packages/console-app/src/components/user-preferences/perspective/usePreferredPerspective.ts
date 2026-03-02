import type { Dispatch, SetStateAction } from 'react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

export const PREFERRED_PERSPECTIVE_USER_PREFERENCE_KEY = 'console.preferredPerspective';

export const usePreferredPerspective = (): [string, Dispatch<SetStateAction<string>>, boolean] => {
  const [
    preferredPerspective,
    setPreferredPerspective,
    preferredPerspectiveLoaded,
  ] = useUserPreference<string>(PREFERRED_PERSPECTIVE_USER_PREFERENCE_KEY);
  return [preferredPerspective, setPreferredPerspective, preferredPerspectiveLoaded];
};
