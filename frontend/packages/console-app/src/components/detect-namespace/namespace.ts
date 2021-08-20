import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setActiveNamespace as setActiveNamespaceForStore } from '@console/internal/actions/ui';
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

export const useValuesForNamespaceContext = () => {
  const { pathname } = useLocation();
  const urlNamespace = getNamespace(pathname);
  const [lastNamespace, setLastNamespace, lastNamespaceLoaded] = useLastNamespace();
  const [preferredNamespace, , preferredNamespaceLoaded] = usePreferredNamespace();
  const [fallbackNamespace, setFallbackNamespace] = React.useState<string>('');
  const dispatch = useDispatch();
  const setNamespace = React.useCallback(
    (namespace: string) => {
      setFallbackNamespace(namespace);
      dispatch(setActiveNamespaceForStore(namespace));
      setLastNamespace(namespace);
    },
    [dispatch, setLastNamespace],
  );
  const useProjects: boolean = useFlag(FLAGS.OPENSHIFT);

  const resourcesLoaded: boolean = !!(
    !flagPending(useProjects) &&
    (urlNamespace || (preferredNamespaceLoaded && lastNamespaceLoaded))
  );

  React.useEffect(() => {
    if (urlNamespace) {
      return;
    }
    if (resourcesLoaded) {
      getValueForNamespace(useProjects, fallbackNamespace, preferredNamespace, lastNamespace)
        .then((ns) => {
          if (ns !== fallbackNamespace) {
            setFallbackNamespace(ns);
            // sync with redux store
            dispatch(setActiveNamespaceForStore(ns));
          }
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Error fetching namespace', e);
        });
    }
    // Only run this hook after all resources have loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourcesLoaded, useProjects]);

  React.useEffect(() => {
    if (urlNamespace) {
      dispatch(setActiveNamespaceForStore(urlNamespace));
    }
  }, [dispatch, urlNamespace]);

  const loaded: boolean = !!urlNamespace || (resourcesLoaded && !!fallbackNamespace);

  return {
    namespace: urlNamespace || fallbackNamespace,
    setNamespace,
    loaded,
  };
};
