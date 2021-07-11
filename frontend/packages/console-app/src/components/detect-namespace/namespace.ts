import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useFlag } from '@console/dynamic-plugin-sdk';
import { setActiveNamespace as setActiveNamespaceForStore } from '@console/internal/actions/ui';
import { getNamespace } from '@console/internal/components/utils/link';
import { flagPending } from '@console/internal/reducers/features';
import { FLAGS } from '@console/shared';
import { usePreferredNamespace } from '../user-preferences/namespace';
import { getValueForNamespace } from './getValueForNamespace';
import { useLastNamespace } from './useLastNamespace';

type NamespaceContextType = {
  namespace?: string;
  setNamespace?: (ns: string) => void;
};

export const NamespaceContext = React.createContext<NamespaceContextType>({});

const useUrlNamespace = () => getNamespace(useLocation().pathname);

export const useValuesForNamespaceContext = () => {
  const urlNamespace = useUrlNamespace();
  const [activeNamespace, setActiveNamespace] = React.useState<string>(urlNamespace);
  const [preferredNamespace, , preferredNamespaceLoaded] = usePreferredNamespace();
  const [lastNamespace, setLastNamespace, lastNamespaceLoaded] = useLastNamespace();
  const useProjects: boolean = useFlag(FLAGS.OPENSHIFT);
  const dispatch = useDispatch();

  // Set namespace when all pending namespace infos are loaded.
  // Automatically check if preferred and last namespace still exist.
  const resourcesLoaded: boolean =
    !flagPending(useProjects) && preferredNamespaceLoaded && lastNamespaceLoaded;
  React.useEffect(() => {
    if (!urlNamespace && resourcesLoaded) {
      getValueForNamespace(preferredNamespace, lastNamespace, useProjects)
        .then((ns: string) => {
          ns !== activeNamespace && setActiveNamespace(ns);
          dispatch(setActiveNamespaceForStore(ns));
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Error fetching namespace', e);
        });
    }
    // Only run this hook after all resources have loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourcesLoaded]);

  // Updates active namespace (in context and redux state) when the url changes.
  // This updates the redux state also after the initial rendering.
  React.useEffect(() => {
    if (urlNamespace) {
      urlNamespace !== activeNamespace && setActiveNamespace(urlNamespace);
      dispatch(setActiveNamespaceForStore(urlNamespace));
    }
  }, [urlNamespace, activeNamespace, dispatch]);

  // Change active namespace (in context and redux state) as well as last used namespace
  // when a component calls setNamespace, for example via useActiveNamespace()
  const setNamespace = React.useCallback(
    (ns: string) => {
      ns !== activeNamespace && setActiveNamespace(ns);
      ns !== lastNamespace && setLastNamespace(ns);
      dispatch(setActiveNamespaceForStore(ns));
    },
    [dispatch, activeNamespace, setActiveNamespace, lastNamespace, setLastNamespace],
  );

  return {
    namespace: activeNamespace,
    setNamespace,
    loaded: !!activeNamespace,
  };
};
