import type { PerspectiveType } from '@console/dynamic-plugin-sdk';
import { useUserPreferenceCompatibility } from '@console/shared/src/hooks/useUserPreferenceCompatibility';
import {
  LAST_PERSPECTIVE_LOCAL_STORAGE_KEY,
  LAST_PERSPECTIVE_USER_SETTINGS_KEY,
} from '../../consts';

export const useLastPerspective = (): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  boolean,
] =>
  useUserPreferenceCompatibility<PerspectiveType>(
    LAST_PERSPECTIVE_USER_SETTINGS_KEY,
    LAST_PERSPECTIVE_LOCAL_STORAGE_KEY,
    '',
  );
