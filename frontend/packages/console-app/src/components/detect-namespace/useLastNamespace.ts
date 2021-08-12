import {
  LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
  LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
} from '@console/shared/src/constants';
import { useUserSettingsCompatibility } from '@console/shared/src/hooks/useUserSettingsCompatibility';

export const useLastNamespace = (): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  boolean,
] =>
  useUserSettingsCompatibility<string>(
    LAST_NAMESPACE_NAME_USER_SETTINGS_KEY,
    LAST_NAMESPACE_NAME_LOCAL_STORAGE_KEY,
  );
