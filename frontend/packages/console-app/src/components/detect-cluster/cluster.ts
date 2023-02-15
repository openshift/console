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
import { formatNamespaceRoute } from '@console/internal/actions/ui';
import { useActiveNamespace } from '@console/shared/src';
import { useClusterFromUrl } from '@console/shared/src/hooks/useClusterFromUrl';
import { ACM_PERSPECTIVE_ID, ADMIN_PERSPECTIVE_ID } from '../../consts';
import { useLastCluster } from './useLastCluster';

type ClusterContextType = {
  cluster?: string;
  setCluster?: (cluster: string) => void;
};

export const ClusterContext = React.createContext<ClusterContextType>({});

export const useValuesForClusterContext = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const location = useLocation();
  const [activeNamespace] = useActiveNamespace();
  const [activePerspective, setActivePerspective] = useActivePerspective();
  const urlCluster = useClusterFromUrl();
  const activeCluster = useSelector(getActiveCluster);
  const [lastCluster, setLastCluster] = useLastCluster();

  // Set initial active cluster in redux on first render.
  React.useEffect(() => {
    dispatch(setActiveCluster(urlCluster ?? lastCluster));
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
          const next = formatNamespaceRoute({
            activeNamespace,
            activeCluster,
            originalPath: location.pathname,
            location,
            forceList: true,
          });
          if (next !== location.pathname) {
            history.push(next);
          }
        }
      },
      [
        activeCluster,
        activePerspective,
        dispatch,
        setLastCluster,
        setActivePerspective,
        activeNamespace,
        location,
        history,
      ],
    ),
  };
};
