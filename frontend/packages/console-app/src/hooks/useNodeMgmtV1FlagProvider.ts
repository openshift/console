import { useEffect } from 'react';
import type { SetFeatureFlag } from '@console/dynamic-plugin-sdk/src/extensions/feature-flags';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import {
  FLAG_NODE_MGMT_V1,
  FLAG_TECH_PREVIEW,
  NODE_MGMT_V1_ENABLED_USER_SETTING_KEY,
} from '../consts';

/**
 * Sets the NODE_MGMT_V1 feature flag from user preferences (mirrors the Node groups management toggle).
 * Requires technology preview
 */
const useNodeMgmtV1FlagProvider = (setFeatureFlag: SetFeatureFlag): void => {
  const techPreviewEnabled = useFlag(FLAG_TECH_PREVIEW);
  const [nodeMgmtV1Enabled] = useUserPreference<boolean>(
    NODE_MGMT_V1_ENABLED_USER_SETTING_KEY,
    techPreviewEnabled ?? false,
    true,
  );
  useEffect(() => {
    setFeatureFlag(FLAG_NODE_MGMT_V1, techPreviewEnabled && nodeMgmtV1Enabled);
  }, [nodeMgmtV1Enabled, setFeatureFlag, techPreviewEnabled]);
};

export default useNodeMgmtV1FlagProvider;
