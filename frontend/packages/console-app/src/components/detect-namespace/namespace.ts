import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setActiveNamespace } from '@console/internal/actions/ui';
import { getNamespace } from '@console/internal/components/utils/link';
import { NamespaceModel, ProjectModel } from '@console/internal/models';
import { k8sGet, K8sKind } from '@console/internal/module/k8s';
import { flagPending } from '@console/internal/reducers/features';
import { FLAGS } from '@console/shared';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';
import { useFlag } from '@console/shared/src/hooks/flag';
import { usePreferredNamespace } from '../user-preferences/namespace/usePreferredNamespace';
import { useLastNamespace } from './useLastNamespace';

type NamespaceContextType = {
  namespace?: string;
  setNamespace?: (ns: string) => void;
};

export const NamespaceContext = React.createContext<NamespaceContextType>({});

const namespaceExists = async (model: K8sKind, namespace: string) => {
  await k8sGet(model, namespace);
};

export const useValuesForNamespaceContext = () => {
  const { pathname } = useLocation();
  const urlNamespace = getNamespace(pathname);

  const [favoritedNamespace, , favoriteLoaded] = usePreferredNamespace();
  const [lastNamespace, setLastNamespace, lastNamespaceLoaded] = useLastNamespace();

  const dispatch = useDispatch();
  const setNamespace = React.useCallback(
    (namespace: string) => {
      dispatch(setActiveNamespace(namespace));
      setLastNamespace(namespace);
    },
    [dispatch, setLastNamespace],
  );
  const useProjects = useFlag(FLAGS.OPENSHIFT);

  // Keep namespace in sync with redux.
  React.useEffect(() => {
    // Url namespace overrides everything. We don't need to wait for loaded
    if (urlNamespace) {
      dispatch(setActiveNamespace(urlNamespace));
    }
    // Automatically sets favorited or latest namespace as soon as
    // both informations are loaded from user settings.
    if (!urlNamespace && favoriteLoaded && lastNamespaceLoaded && !flagPending(useProjects)) {
      const setActiveIfExists = (ns: string) => {
        if (!ns) {
          return Promise.reject();
        }
        return namespaceExists(useProjects ? ProjectModel : NamespaceModel, ns)
          .then(() => dispatch(setActiveNamespace(ns)))
          .catch((res) => {
            // eslint-disable-next-line no-console
            console.warn('Error fetching namespace', ns);
            throw res;
          });
      };
      setActiveIfExists(favoritedNamespace)
        .catch(() => setActiveIfExists(lastNamespace))
        .catch(() => {});
    }
    // Only run this hook after favorite and last namespace are loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteLoaded, lastNamespaceLoaded, useProjects]);

  return {
    namespace: urlNamespace || favoritedNamespace || lastNamespace || ALL_NAMESPACES_KEY,
    setNamespace,
    loaded: favoriteLoaded && lastNamespaceLoaded,
  };
};
