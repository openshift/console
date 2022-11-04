import { HUB_CLUSTER_NAME, LAST_CLUSTER_SESSION_STORAGE_KEY } from '@console/shared/src';
import { useUserSettingsLocalStorage } from '@console/shared/src/hooks/useUserSettingsLocalStorage';

export const useLastCluster = (): [string, React.Dispatch<React.SetStateAction<string>>] =>
  useUserSettingsLocalStorage<string>(
    LAST_CLUSTER_SESSION_STORAGE_KEY,
    LAST_CLUSTER_SESSION_STORAGE_KEY,
    HUB_CLUSTER_NAME,
    false,
    true,
  );
