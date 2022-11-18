import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch, useSelector } from 'react-redux';
import {
  getActiveCluster,
  setActiveCluster,
  useActivePerspective,
} from '@console/dynamic-plugin-sdk/src';
import { clearSSARFlags, detectFeatures } from '@console/internal/actions/features';
import { removeQueryArgument, setQueryArgument } from '@console/internal/components/utils';
import { useQueryParams } from '@console/shared/src';
import isMultiClusterEnabled from '../../utils/isMultiClusterEnabled';
import { useLastCluster } from './useLastCluster';

type ClusterContextType = {
  cluster?: string;
  setCluster?: (cluster: string) => void;
};

export const ClusterContext = React.createContext<ClusterContextType>({});

const isValidCluster = (c) => window.SERVER_FLAGS.clusters.includes(c);

export const useValuesForClusterContext = (): ClusterContextType => {
  const dispatch = useDispatch();
  const queryParams = useQueryParams();
  const clusterParam = queryParams.get('cluster');
  const cluster = useSelector(getActiveCluster);
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const [lastCluster, setLastCluster] = useLastCluster();
  // Set initial value for active cluster
  React.useEffect(() => {
    const initCluster = clusterParam ?? lastCluster;
    if (isValidCluster(initCluster)) {
      dispatch(setActiveCluster(initCluster));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!isMultiClusterEnabled()) {
      removeQueryArgument('cluster');
      return;
    }
    if (clusterParam !== cluster) {
      setQueryArgument('cluster', cluster);
    }
    dispatch(clearSSARFlags());
    dispatch(detectFeatures());
    // TODO Restart API discovery on cluster change once graphql is multicluster compatible
    // dispatch(startAPIDiscovery());
  }, [dispatch, cluster, clusterParam]);

  const setCluster = React.useCallback(
    (newCluster: string) => {
      if (isValidCluster(newCluster)) {
        setLastCluster(newCluster);
        dispatch(setActiveCluster(newCluster));
        if (activePerspective === 'acm') {
          setActivePerspective('admin');
        }
      }
    },
    [activePerspective, dispatch, setActivePerspective, setLastCluster],
  );

  return { cluster, setCluster };
};
