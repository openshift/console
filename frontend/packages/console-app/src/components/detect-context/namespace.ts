import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  setActiveNamespace as setActiveNamespaceForStore,
  formatNamespaceRoute,
} from '@console/internal/actions/ui';
import { getNamespace } from '@console/internal/components/utils/link';
import { flagPending } from '@console/internal/reducers/features';
import { FLAGS } from '@console/shared/src/constants/common';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { usePreferredNamespace } from '../user-preferences/namespace/usePreferredNamespace';
import { getValueForNamespace } from './getValueForNamespace';
import { useLastNamespace } from './useLastNamespace';

type NamespaceContextType = {
  namespace?: string;
  setNamespace?: (ns: string) => void;
};

export const NamespaceContext = createContext<NamespaceContextType>({});

const useUrlNamespace = () => getNamespace(useLocation().pathname);

type UseValuesForNamespaceContext = () => {
  namespace: string;
  setNamespace: (ns: string) => void;
  loaded: boolean;
};

export const useValuesForNamespaceContext: UseValuesForNamespaceContext = () => {
  const urlNamespace = useUrlNamespace();
  const navigate = useNavigate();
  const [activeNamespace, setActiveNamespace] = useState<string>(urlNamespace);
  const [preferredNamespace, , preferredNamespaceLoaded] = usePreferredNamespace();
  const [lastNamespace, setLastNamespace, lastNamespaceLoaded] = useLastNamespace();
  const useProjects: boolean = useFlag(FLAGS.OPENSHIFT);
  const dispatch = useConsoleDispatch();

  const activeNamespaceRef = useRef(activeNamespace);
  activeNamespaceRef.current = activeNamespace;
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const lastNamespaceRef = useRef(lastNamespace);
  lastNamespaceRef.current = lastNamespace;

  const updateNamespace = useCallback(
    (ns: string) => {
      if (ns !== activeNamespaceRef.current) {
        setActiveNamespace(ns);
        const oldPath = window.location.pathname;
        const newPath = formatNamespaceRoute(ns, oldPath, window.location);
        if (newPath !== oldPath) {
          navigateRef.current(newPath);
        }
      }
      dispatch(setActiveNamespaceForStore(ns));
    },
    [dispatch],
  );

  // Set namespace when all pending namespace infos are loaded.
  // Automatically check if preferred and last namespace still exist.
  const resourcesLoaded: boolean =
    !flagPending(useProjects) && preferredNamespaceLoaded && lastNamespaceLoaded;
  useEffect(() => {
    if (!urlNamespace && resourcesLoaded) {
      getValueForNamespace(
        preferredNamespace,
        lastNamespace,
        useProjects,
        activeNamespaceRef.current,
      )
        .then((ns: string) => {
          updateNamespace(ns);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Error fetching namespace', e);
        });
    }
  }, [
    resourcesLoaded,
    urlNamespace,
    preferredNamespace,
    lastNamespace,
    useProjects,
    updateNamespace,
  ]);

  // Updates active namespace (in context and redux state) when the url changes.
  // This updates the redux state also after the initial rendering.
  useEffect(() => {
    if (urlNamespace) {
      updateNamespace(urlNamespace);
    }
  }, [urlNamespace, updateNamespace]);

  // Change active namespace (in context and redux state) as well as last used namespace
  // when a component calls setNamespace, for example via useActiveNamespace()
  const setNamespace = useCallback(
    (ns: string) => {
      if (ns !== lastNamespaceRef.current) {
        setLastNamespace(ns);
      }
      updateNamespace(ns);
    },
    [updateNamespace, setLastNamespace],
  );

  return {
    namespace: activeNamespace,
    setNamespace,
    loaded: !!activeNamespace,
  };
};
