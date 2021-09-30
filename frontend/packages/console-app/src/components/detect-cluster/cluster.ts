import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { setActiveCluster } from '@console/internal/actions/ui';
import { LAST_CLUSTER_USER_SETTINGS_KEY } from '@console/shared/src/constants';
import { useUserSettings } from '@console/shared/src/hooks/useUserSettings';

type ClusterContextType = {
  cluster?: string;
  setCluster?: (cluster: string) => void;
};

export const ClusterContext = React.createContext<ClusterContextType>({});

export const useValuesForClusterContext = () => {
  const [lastCluster, setLastCluster, lastClusterLoaded] = useUserSettings<string>(
    LAST_CLUSTER_USER_SETTINGS_KEY,
    'local-cluster',
    true,
  );
  const dispatch = useDispatch();
  const setCluster = React.useCallback(
    (cluster: string) => {
      dispatch(setActiveCluster(cluster));
      setLastCluster(cluster);
    },
    [dispatch, setLastCluster],
  );

  React.useEffect(() => {
    // TODO: Detect cluster from URL.
    if (lastClusterLoaded && lastCluster) {
      dispatch(setActiveCluster(lastCluster));
    }
    // Only run this hook after last cluster is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastClusterLoaded]);

  return {
    cluster: lastCluster,
    setCluster,
    loaded: lastClusterLoaded,
  };
};
