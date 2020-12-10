import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getNamespace } from '@console/internal/components/utils/link';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { setActiveNamespace } from '@console/internal/actions/ui';
import {
  ALL_NAMESPACES_KEY,
  USERSETTINGS_PREFIX,
  NAMESPACE_USERSETTINGS_PREFIX,
  NAMESPACE_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants';

type NamespaceContextType = {
  namespace?: string;
  setNamespace?: (ns: string) => void;
};

const FAVORITE_NAMESPACE_NAME_USERSETTINGS_KEY = `${NAMESPACE_USERSETTINGS_PREFIX}.favorite`;
const FAVORITE_NAMESPACE_NAME_LOCAL_STORAGE_KEY = NAMESPACE_LOCAL_STORAGE_KEY;

const LAST_NAMESPACE_NAME_USER_SETTINGS_KEY = `${USERSETTINGS_PREFIX}.lastNamespace`;
const LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY = `bridge/last-namespace-name`;

export const NamespaceContext = React.createContext<NamespaceContextType>({});

export const useValuesForNamespaceContext = () => {
  const { pathname } = useLocation();
  const urlNamespace = getNamespace(pathname);

  const [favoritedNamespace, , favoriteLoaded] = useUserSettingsCompatibility<string>(
    FAVORITE_NAMESPACE_NAME_USERSETTINGS_KEY,
    FAVORITE_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  );
  const [lastNamespace, setLastnameNamespace, lastNamespaceLoaded] = useUserSettingsCompatibility<
    string
  >(LAST_NAMESPACE_NAME_USER_SETTINGS_KEY, LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);

  const dispatch = useDispatch();
  const setNamespace = React.useCallback(
    (namespace: string) => {
      dispatch(setActiveNamespace(namespace));
      setLastnameNamespace(namespace);
    },
    [dispatch, setLastnameNamespace],
  );

  // Keep namespace in sync with redux
  React.useEffect(() => {
    // Url namespace overrides everything. We don't need to wait for loaded
    if (urlNamespace) {
      dispatch(setActiveNamespace(urlNamespace));
    } else if (favoriteLoaded && lastNamespaceLoaded) {
      // Calculate namespace after loading: favorite > last used namespace > all
      dispatch(setActiveNamespace(favoritedNamespace || lastNamespace || ALL_NAMESPACES_KEY));
    }
    // only run this hook when favorite and last namespace is loaded from user settings
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlNamespace, favoriteLoaded, lastNamespaceLoaded]);

  return {
    namespace: urlNamespace || lastNamespace || favoritedNamespace || ALL_NAMESPACES_KEY,
    setNamespace,
    loaded: favoriteLoaded && lastNamespaceLoaded,
  };
};
