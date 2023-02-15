import { HUB_CLUSTER_NAME, LAST_CLUSTER_USER_SETTINGS_KEY } from '@console/shared/src';
import { useUserSettingsLocalStorage } from '@console/shared/src/hooks/useUserSettingsLocalStorage';

export const useLastCluster = (): [string, React.Dispatch<React.SetStateAction<string>>] =>
  useUserSettingsLocalStorage<string>(
    LAST_CLUSTER_USER_SETTINGS_KEY,
    LAST_CLUSTER_USER_SETTINGS_KEY,
    HUB_CLUSTER_NAME,
    false,
    true,
  );
