import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useLocation } from 'react-router-dom';
import {
  getActiveCluster,
  setActiveCluster,
  useActivePerspective,
} from '@console/dynamic-plugin-sdk/src';
import { clearSSARFlags, detectFeatures } from '@console/internal/actions/features';
import { startAPIDiscovery } from '@console/internal/actions/k8s';
import { useClusterFromUrl } from '@console/shared/src/hooks/useClusterFromUrl';
import { useLastCluster } from './useLastCluster';

type ClusterContextType = {
  cluster?: string;
  setCluster?: (cluster: string) => void;
};

export const ClusterContext = React.createContext<ClusterContextType>({});

export const useValuesForClusterContext = (): ClusterContextType => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const urlCluster = useClusterFromUrl();
  const cluster = useSelector(getActiveCluster);
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const [lastCluster, setLastCluster] = useLastCluster();
  // Set initial value for active cluster
  React.useEffect(() => {
    dispatch(setActiveCluster(urlCluster ?? lastCluster));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (urlCluster && urlCluster !== cluster) {
      history.push(location.pathname.replace(`/c/${urlCluster}`, `/c/${cluster}`));
    }
    dispatch(clearSSARFlags());
    dispatch(detectFeatures());
    dispatch(startAPIDiscovery());
  }, [cluster, dispatch, history, location.pathname, urlCluster]);

  const setCluster = React.useCallback(
    (newCluster: string) => {
      if (newCluster !== cluster) {
        setLastCluster(newCluster);
        dispatch(setActiveCluster(newCluster));
        if (activePerspective === 'acm') {
          setActivePerspective('admin');
        }
      }
    },
    [activePerspective, cluster, dispatch, setActivePerspective, setLastCluster],
  );

  return { cluster, setCluster };
};
