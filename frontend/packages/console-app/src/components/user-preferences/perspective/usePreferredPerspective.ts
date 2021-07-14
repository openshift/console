import { useUserSettings } from '@console/shared';

const PREFERRED_PERSPECTIVE_USER_SETTING_KEY: string = 'console.preferredPerspective';

export const usePreferredPerspective = (): [string, boolean] => {
  const [preferredPerspective, , preferredPerspectiveLoaded] = useUserSettings<string>(
    PREFERRED_PERSPECTIVE_USER_SETTING_KEY,
  );
  return [preferredPerspective, preferredPerspectiveLoaded];
};
