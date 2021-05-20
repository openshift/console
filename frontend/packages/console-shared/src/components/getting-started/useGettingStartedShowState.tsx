import { useUserSettings } from '../../hooks/useUserSettings';

export enum GettingStartedShowState {
  SHOW = 'show',
  HIDE = 'hide',
  DISAPPEAR = 'disappear',
}

export const useGettingStartedShowState = (
  key: string,
  defaultValue = GettingStartedShowState.SHOW,
) => useUserSettings<GettingStartedShowState>(key, defaultValue, true);
