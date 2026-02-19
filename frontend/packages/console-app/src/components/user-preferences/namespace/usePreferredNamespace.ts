import type { Dispatch, SetStateAction } from 'react';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

export const PREFERRED_NAMESPACE_USER_SETTING_KEY: string = 'console.namespace.favorite';

export const usePreferredNamespace = (): [string, Dispatch<SetStateAction<string>>, boolean] => {
  const [preferredNamespace, setPreferredNamespace, preferredNamespaceLoaded] = useUserPreference<
    string
  >(PREFERRED_NAMESPACE_USER_SETTING_KEY);

  // This toString is workaround because the useUserPreference hook returns a number or boolean
  // when the saved value represents a number (1234) or boolean (true/false).
  // This is a workaround for https://bugzilla.redhat.com/show_bug.cgi?id=2009345.
  // We will implement a more generic fix with https://issues.redhat.com/browse/ODC-6514
  return [preferredNamespace?.toString(), setPreferredNamespace, preferredNamespaceLoaded];
};
