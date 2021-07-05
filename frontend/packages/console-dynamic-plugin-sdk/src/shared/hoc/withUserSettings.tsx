import * as React from 'react';
import { useUserSettings } from '../hooks';

export type WithUserSettingsProps<T> = {
  userSettingState: T;
  setUserSettingState: (v: T) => void;
};

export const withUserSettings = <Props extends WithUserSettingsProps<T>, T = string>(
  configStorageKey: string,
  defaultvalue?: T,
) => (
  WrappedComponent: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithUserSettingsProps<T>>> => (props: Props) => {
  const [state, setState, loaded] = useUserSettings(configStorageKey, defaultvalue);
  return loaded ? (
    <WrappedComponent {...props} userSettingState={state} setUserSettingState={setState} />
  ) : null;
};
