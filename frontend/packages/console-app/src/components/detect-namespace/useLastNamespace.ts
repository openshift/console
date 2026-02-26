import { LAST_NAMESPACE_NAME_USER_SETTINGS_KEY } from '@console/shared/src/constants';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';

export const useLastNamespace = (): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  boolean,
] => {
  const [lastNamespace, setLastNamespace, lastNamespaceLoaded] = useUserPreference<string>(
    LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
  );

  // This toString is workaround because the useUserPreference hook returns a number or boolean
  // when the saved value represents a number (1234) or boolean (true/false).
  // This is a workaround for https://bugzilla.redhat.com/show_bug.cgi?id=2009345.
  // We will implement a more generic fix with https://issues.redhat.com/browse/ODC-6514
  return [lastNamespace?.toString(), setLastNamespace, lastNamespaceLoaded];
};
