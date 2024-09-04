import { useUserSettings } from '@console/shared';

const PREFERRED_LIGHTSPEED_USER_SETTING_KEY: string = 'console.hideLightspeedButton';

export const useHideLightspeed = (): [boolean, boolean] => {
  const [hideLightspeed, , hideLightspeedLoaded] = useUserSettings<boolean>(
    PREFERRED_LIGHTSPEED_USER_SETTING_KEY,
    false,
    true,
  );
  return [hideLightspeed, hideLightspeedLoaded];
};
