// TODO remove multicluster
import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { CoreState } from '@console/dynamic-plugin-sdk/src';
import { setActiveCluster } from '@console/dynamic-plugin-sdk/src/app/core/actions';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src/lib-core';
import { clearSSARFlags, detectFeatures } from '@console/internal/actions/features';
import { formatNamespaceRoute } from '@console/internal/actions/ui';
import { LAST_CLUSTER_USER_SETTINGS_KEY, HUB_CLUSTER_NAME } from '@console/shared/src/constants';
import { useActiveNamespace } from '@console/shared/src/hooks/useActiveNamespace';
import { useUserSettingsLocalStorage } from '@console/shared/src/hooks/useUserSettingsLocalStorage';
import { ACM_PERSPECTIVE_ID, ADMIN_PERSPECTIVE_ID } from '../../consts';

type ClusterContextType = {
  cluster?: string;
  setCluster?: (cluster: string) => void;
};

export const ClusterContext = React.createContext<ClusterContextType>({});

export const useValuesForClusterContext = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const [activeNamespace] = useActiveNamespace();
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const activeCluster = useSelector((state: CoreState) => state.activeCluster);
  const [lastCluster, setLastCluster] = useUserSettingsLocalStorage<string>(
    LAST_CLUSTER_USER_SETTINGS_KEY,
    LAST_CLUSTER_USER_SETTINGS_KEY,
    HUB_CLUSTER_NAME,
    false,
    true,
  );

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
        if (cluster !== activeCluster) {
          dispatch(setActiveCluster(cluster));
          setLastCluster(cluster);
          dispatch(clearSSARFlags());
          dispatch(detectFeatures());
        }
        if (activePerspective === ACM_PERSPECTIVE_ID) {
          setActivePerspective(ADMIN_PERSPECTIVE_ID);
        } else {
          const oldPath = window.location.pathname;
          const newPath = formatNamespaceRoute(activeNamespace, oldPath, window.location, true);
          if (newPath !== oldPath) {
            history.push(newPath);
          }
        }
      },
      [
        activeCluster,
        activeNamespace,
        activePerspective,
        dispatch,
        history,
        setActivePerspective,
        setLastCluster,
      ],
    ),
  };
};
