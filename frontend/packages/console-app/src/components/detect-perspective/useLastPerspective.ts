import type { PerspectiveType } from '@console/dynamic-plugin-sdk';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { LAST_PERSPECTIVE_USER_SETTINGS_KEY } from '../../consts';

export const useLastPerspective = (): [
  string,
  React.Dispatch<React.SetStateAction<string>>,
  boolean,
] =>
  useUserPreference<PerspectiveType>(LAST_PERSPECTIVE_USER_SETTINGS_KEY, '');
