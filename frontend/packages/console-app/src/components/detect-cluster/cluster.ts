import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import isMultiClusterEnabled from '@console/app/src/utils/isMultiClusterEnabled';
import { setActiveCluster } from '@console/dynamic-plugin-sdk/src/app/core/actions';
import { formatNamespaceRoute } from '@console/internal/actions/ui';
import { getCluster } from '@console/internal/components/utils/link';
import { history } from '@console/internal/components/utils/router';
// import { useActiveNamespace } from '@console/shared';
import store from '@console/internal/redux';
import { LAST_CLUSTER_USER_SETTINGS_KEY, HUB_CLUSTER_NAME } from '@console/shared/src/constants';
import { useUserSettingsLocalStorage } from '@console/shared/src/hooks/useUserSettingsLocalStorage';

export const multiClusterRoutePrefixes = ['/k8s/all-namespaces', '/k8s/cluster', '/k8s/ns'];

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

  const urlCluster = getCluster(useLocation().pathname);
  React.useEffect(() => {
    if (urlCluster) {
      setLastCluster(urlCluster);
      dispatch(setActiveCluster(urlCluster));
    } else if (lastCluster) {
      dispatch(setActiveCluster(lastCluster));
    }

    if (
      isMultiClusterEnabled() &&
      lastCluster &&
      !urlCluster &&
      multiClusterRoutePrefixes.some((pattern) => window.location.pathname.startsWith(pattern))
    ) {
      const activeNamespace = store.getState().UI.get('activeNamespace');
      const newPath = formatNamespaceRoute(
        activeNamespace,
        window.location.pathname,
        window.location,
        false,
        lastCluster,
      );

      if (newPath !== window.location.pathname) {
        history.pushPath(newPath);
      }
    }
    // Only run this hook after window path changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCluster, window.location.pathname]);

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
