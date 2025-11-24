import { FLAG_TECH_PREVIEW } from '@console/app/src/consts';
import { SetFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { useFlag } from '@console/dynamic-plugin-sdk/src/utils/flags';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';
import { FLAG_OLMV1_ENABLED, OLMV1_ENABLED_USER_SETTING_KEY } from '../const';

/**
 * Hook provider that sets the OLMV1_ENABLED feature flag based on user preferences.
 * This flag mirrors the state of the OLMv1 catalog toggle switch.
 */
const useOLMv1FlagProvider = (setFeatureFlag: SetFeatureFlag): void => {
  const techPreviewEnabled = useFlag(FLAG_TECH_PREVIEW);
  const [olmv1Enabled] = useUserSettings<boolean>(
    OLMV1_ENABLED_USER_SETTING_KEY,
    techPreviewEnabled ?? false,
    true,
  );
  setFeatureFlag(FLAG_OLMV1_ENABLED, techPreviewEnabled && olmv1Enabled);
};

export default useOLMv1FlagProvider;
