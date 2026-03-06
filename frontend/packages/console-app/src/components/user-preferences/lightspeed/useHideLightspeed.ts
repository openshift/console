import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

// duplicated in openshift/lightspeed-operator, so be mindful of changing
const PREFERRED_LIGHTSPEED_USER_PREFERENCE_KEY: string = 'console.hideLightspeedButton';

export const useHideLightspeed = (): [boolean, boolean] => {
  const [hideLightspeed, , hideLightspeedLoaded] = useUserPreference<boolean>(
    PREFERRED_LIGHTSPEED_USER_PREFERENCE_KEY,
    false,
    true,
  );
  return [hideLightspeed, hideLightspeedLoaded];
};
