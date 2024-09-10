import { useUserSettings } from '@console/shared';

// duplicated in openshift/lightspeed-operator, so be mindful of changing
const PREFERRED_LIGHTSPEED_USER_SETTING_KEY: string = 'console.hideLightspeedButton';

export const useHideLightspeed = (): [boolean, boolean] => {
  const [hideLightspeed, , hideLightspeedLoaded] = useUserSettings<boolean>(
    PREFERRED_LIGHTSPEED_USER_SETTING_KEY,
    false,
    true,
  );
  return [hideLightspeed, hideLightspeedLoaded];
};
