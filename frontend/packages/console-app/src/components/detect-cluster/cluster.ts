import * as React from 'react';
import { useDispatch } from 'react-redux';
import { setActiveCluster } from '@console/dynamic-plugin-sdk/src/app/core/actions';
import { LAST_CLUSTER_USER_SETTINGS_KEY, HUB_CLUSTER_NAME } from '@console/shared/src/constants';
import { useUserSettingsLocalStorage } from '@console/shared/src/hooks/useUserSettingsLocalStorage';

type ClusterContextType = {
  cluster?: string;
  setCluster?: (cluster: string) => void;
};

export const ClusterContext = React.createContext<ClusterContextType>({});

export const useValuesForClusterContext = () => {
  const [lastCluster, setLastCluster] = useUserSettingsLocalStorage<string>(
    LAST_CLUSTER_USER_SETTINGS_KEY,
    LAST_CLUSTER_USER_SETTINGS_KEY,
    HUB_CLUSTER_NAME,
    true,
    true,
  );

  const dispatch = useDispatch();

  // Set initial active cluster in redux on first render.
  React.useEffect(() => {
    // TODO: Detect cluster from URL.
    dispatch(setActiveCluster(lastCluster));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    cluster: lastCluster,
    setCluster: React.useCallback(
      (cluster: string) => {
        dispatch(setActiveCluster(cluster));
        setLastCluster(cluster);
      },
      [dispatch, setLastCluster],
    ),
  };
};
