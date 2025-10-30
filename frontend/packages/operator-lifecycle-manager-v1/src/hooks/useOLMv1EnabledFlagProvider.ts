import { SetFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { useUserSettings } from '@console/shared';
import { FLAG_OLMV1_ENABLED, OLMV1_ENABLED_USER_SETTING_KEY } from '../const';

/**
 * Hook provider that sets the OLMV1_ENABLED feature flag based on user preferences.
 * This flag mirrors the state of the OLMv1 catalog toggle switch.
 */
const useOLMv1EnabledFlagProvider = (setFeatureFlag: SetFeatureFlag): void => {
  const [olmv1Enabled] = useUserSettings<boolean>(OLMV1_ENABLED_USER_SETTING_KEY, false, true);
  setFeatureFlag(FLAG_OLMV1_ENABLED, olmv1Enabled ?? false);
};

export default useOLMv1EnabledFlagProvider;
