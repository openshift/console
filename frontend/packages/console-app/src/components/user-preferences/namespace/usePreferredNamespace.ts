import { Dispatch, SetStateAction } from 'react';
import { useUserSettings } from '@console/shared';

const PREFERRED_NAMESPACE_USER_SETTING_KEY: string = 'console.namespace.favorite';

export const usePreferredNamespace = (): [string, Dispatch<SetStateAction<string>>, boolean] => {
  const [preferredNamespace, setPreferredNamespace, preferredNamespaceLoaded] = useUserSettings<
    string
  >(PREFERRED_NAMESPACE_USER_SETTING_KEY);
  return [preferredNamespace, setPreferredNamespace, preferredNamespaceLoaded];
};
