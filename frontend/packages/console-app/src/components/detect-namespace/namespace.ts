import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { getNamespace } from '@console/internal/components/utils/link';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';
import { setActiveNamespace } from '@console/internal/actions/ui';
import { ALL_NAMESPACES_KEY } from '@console/shared/src/constants';

type NamespaceContextType = {
  namespace?: string;
  setNamespace?: (ns: string) => void;
};

const LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY = `bridge/last-namespace-name`;
const LAST_NAMESPACE_NAME_USER_SETTINGS_KEY = 'console.lastNamespace';

export const NamespaceContext = React.createContext<NamespaceContextType>({});

export const useValuesForNamespaceContext = () => {
  const { pathname } = useLocation();
  const urlNamespace = getNamespace(pathname);
  /**
   * [TODO]: use favorite namespace here if there is any
   *  const [favorite] = useUserSettings()
   */
  const [namespace, setNs, loaded] = useUserSettingsCompatibility(
    LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
    LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
    urlNamespace || ALL_NAMESPACES_KEY,
  );
  const dispatchreduxAction = useDispatch();
  const setNamespace = React.useCallback(
    (ns: string) => {
      dispatchreduxAction(setActiveNamespace(ns));
      setNs(ns);
    },
    [dispatchreduxAction, setNs],
  );

  React.useEffect(() => {
    if (loaded) {
      dispatchreduxAction(setActiveNamespace(urlNamespace || namespace || ALL_NAMESPACES_KEY));
    }
    // only run this hook when namespace is loaded from user settings
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded]);

  return { namespace: urlNamespace || namespace || ALL_NAMESPACES_KEY, setNamespace, loaded };
};
