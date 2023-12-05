import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import {
  setActiveNamespace as setActiveNamespaceForStore,
  formatNamespaceRoute,
} from '@console/internal/actions/ui';
import { getNamespace } from '@console/internal/components/utils/link';
import { flagPending } from '@console/internal/reducers/features';
import { FLAGS } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import { usePreferredNamespace } from '../user-preferences/namespace';
import { getValueForNamespace } from './getValueForNamespace';
import { useLastNamespace } from './useLastNamespace';

type NamespaceContextType = {
  namespace?: string;
  setNamespace?: (ns: string) => void;
};

export const NamespaceContext = React.createContext<NamespaceContextType>({});

const useUrlNamespace = () => getNamespace(useLocation().pathname);

type UseValuesForNamespaceContext = () => {
  namespace: string;
  setNamespace: (ns: string) => void;
  loaded: boolean;
};

export const useValuesForNamespaceContext: UseValuesForNamespaceContext = () => {
  const urlNamespace = useUrlNamespace();
  const navigate = useNavigate();
  const [activeNamespace, setActiveNamespace] = React.useState<string>(urlNamespace);
  const [preferredNamespace, , preferredNamespaceLoaded] = usePreferredNamespace();
  const [lastNamespace, setLastNamespace, lastNamespaceLoaded] = useLastNamespace();
  const useProjects: boolean = useFlag(FLAGS.OPENSHIFT);
  const dispatch = useDispatch();

  const updateNamespace = (ns) => {
    if (ns !== activeNamespace) {
      setActiveNamespace(ns);
      const oldPath = window.location.pathname;
      const newPath = formatNamespaceRoute(ns, oldPath, window.location);
      if (newPath !== oldPath) {
        navigate(newPath);
      }
    }
    dispatch(setActiveNamespaceForStore(ns));
  };

  // Set namespace when all pending namespace infos are loaded.
  // Automatically check if preferred and last namespace still exist.
  const resourcesLoaded: boolean =
    !flagPending(useProjects) && preferredNamespaceLoaded && lastNamespaceLoaded;
  React.useEffect(() => {
    if (!urlNamespace && resourcesLoaded) {
      getValueForNamespace(preferredNamespace, lastNamespace, useProjects)
        .then((ns: string) => {
          updateNamespace(ns);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Error fetching namespace', e);
        });
    }
    // Only run this hook after all resources have loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourcesLoaded, navigate]);

  // Updates active namespace (in context and redux state) when the url changes.
  // This updates the redux state also after the initial rendering.
  React.useEffect(() => {
    if (urlNamespace) {
      updateNamespace(urlNamespace);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlNamespace, activeNamespace, dispatch, navigate]);

  // Change active namespace (in context and redux state) as well as last used namespace
  // when a component calls setNamespace, for example via useActiveNamespace()
  const setNamespace = React.useCallback(
    (ns: string) => {
      ns !== lastNamespace && setLastNamespace(ns);
      updateNamespace(ns);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, activeNamespace, setActiveNamespace, lastNamespace, setLastNamespace, navigate],
  );

  return {
    namespace: activeNamespace,
    setNamespace,
    loaded: !!activeNamespace,
  };
};
