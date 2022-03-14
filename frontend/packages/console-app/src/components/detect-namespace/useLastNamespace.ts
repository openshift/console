import {
  LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';

export const useLastNamespace = (): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  boolean,
] => {
  const [lastNamespace, setLastNamespace, lastNamespaceLoaded] = useUserSettingsCompatibility<
    string
  >(LAST_NAMESPACE_NAME_USER_SETTINGS_KEY, LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY);

  // This toString is workaround because the useUserSettings hook returns a number or boolean
  // when the saved value represents a number (1234) or boolean (true/false).
  // This is a workaround for https://bugzilla.redhat.com/show_bug.cgi?id=2009345.
  // We will implement a more generic fix with https://issues.redhat.com/browse/ODC-6514
  return [lastNamespace?.toString(), setLastNamespace, lastNamespaceLoaded];
};
