import { useUserSettings } from '@console/shared';

const PREFERRED_LIGHTSPEED_USER_SETTING_KEY: string = 'console.showLightspeedButton';

export const useLightspeed = (): [boolean, boolean] => {
  const [showLightspeed, , showLightspeedLoaded] = useUserSettings<boolean>(
    PREFERRED_LIGHTSPEED_USER_SETTING_KEY,
  );
  return [showLightspeed, showLightspeedLoaded];
};
