import { useUserPreference } from '../../hooks/useUserPreference';

export enum GettingStartedShowState {
  SHOW = 'show',
  HIDE = 'hide',
  DISAPPEAR = 'disappear',
}

export const useGettingStartedShowState = (
  key: string,
  defaultValue = GettingStartedShowState.SHOW,
) => useUserPreference<GettingStartedShowState>(key, defaultValue, true);
