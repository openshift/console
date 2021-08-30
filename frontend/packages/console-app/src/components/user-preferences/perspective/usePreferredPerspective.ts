import { Dispatch, SetStateAction } from 'react';
import { useUserSettings } from '@console/shared';

const PREFERRED_PERSPECTIVE_USER_SETTING_KEY = 'console.preferredPerspective';

export const usePreferredPerspective = (): [string, Dispatch<SetStateAction<string>>, boolean] => {
  const [
    preferredPerspective,
    setPreferredPerspective,
    preferredPerspectiveLoaded,
  ] = useUserSettings<string>(PREFERRED_PERSPECTIVE_USER_SETTING_KEY);
  return [preferredPerspective, setPreferredPerspective, preferredPerspectiveLoaded];
};
