import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  getActiveCluster,
  setActiveCluster,
  useActivePerspective,
} from '@console/dynamic-plugin-sdk/src';
import { clearSSARFlags, detectFeatures } from '@console/internal/actions/features';
import { startAPIDiscovery } from '@console/internal/actions/k8s';
import { getClusterFromUrl, history, legalNamePattern } from '@console/internal/components/utils';
import { useLastCluster } from './useLastCluster';

type ClusterContextType = {
  cluster?: string;
  setCluster?: (cluster: string) => void;
};

export const ClusterContext = React.createContext<ClusterContextType>({});

export const formatClusterPath = (cluster: string, path: string, location?: Location): string => {
  const [, prefix, currentCluster, suffix] =
    path.match(`^(.*)/c/(${legalNamePattern})(/.*)$`) ?? [];
  if (!currentCluster || currentCluster === cluster) {
    return path;
  }
  const newPath = `${prefix}/c/${cluster}${suffix}`;
  return location ? `${newPath}${location.search}${location.hash}` : newPath;
};

export const useValuesForClusterContext = (): ClusterContextType => {
  const dispatch = useDispatch();
  const location = useLocation();
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const urlCluster = getClusterFromUrl(location.pathname);
  const cluster = useSelector(getActiveCluster);
  const [lastCluster, setLastCluster] = useLastCluster();

  // Set initial value for active cluster
  React.useEffect(() => {
    dispatch(setActiveCluster(urlCluster ?? lastCluster));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const currentPath = window.location.pathname;
    const newPath = formatClusterPath(cluster, currentPath, window.location);
    if (newPath !== currentPath) {
      history.pushPath(newPath);
    }
    dispatch(clearSSARFlags());
    dispatch(detectFeatures());
    dispatch(startAPIDiscovery());
  }, [cluster, dispatch]);

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
