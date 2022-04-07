import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { setActiveNamespace } from '@console/internal/actions/ui';
import { getNamespace } from '@console/internal/components/utils/link';
import { usePreferredNamespace } from '../user-preferences/namespace/usePreferredNamespace';
import { useLastNamespace } from './useLastNamespace';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';

type NamespaceContextType = {
  namespace?: string;
  setNamespace?: (ns: string) => void;
};

export const NamespaceContext = React.createContext<NamespaceContextType>({});

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

  // Keep namespace in sync with redux.
  React.useEffect(() => {
    // Url namespace overrides everything. We don't need to wait for loaded
    if (urlNamespace) {
      dispatch(setActiveNamespace(urlNamespace));
    }
    // Automatically sets favorited or latest namespace as soon as
    // both informations are loaded from user settings.
    if (!urlNamespace && favoriteLoaded && lastNamespaceLoaded) {
      dispatch(setActiveNamespace(favoritedNamespace || lastNamespace || ALL_NAMESPACES_KEY));
    }
    // Only run this hook after favorite and last namespace are loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [favoriteLoaded, lastNamespaceLoaded]);

  return {
    namespace: urlNamespace || favoritedNamespace || lastNamespace || ALL_NAMESPACES_KEY,
    setNamespace,
    loaded: favoriteLoaded && lastNamespaceLoaded,
  };
};
