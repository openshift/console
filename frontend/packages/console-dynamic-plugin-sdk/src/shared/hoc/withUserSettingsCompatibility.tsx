import * as React from 'react';
import { useUserSettingsCompatibility } from '../hooks';

export type WithUserSettingsCompatibilityProps<T> = {
  userSettingState: T;
  setUserSettingState: (v: T) => void;
};

export const withUserSettingsCompatibility = <
  Props extends WithUserSettingsCompatibilityProps<T>,
  T = string
>(
  configStorageKey: string,
  localStoragekey: string,
  defaultvalue?: T,
  sync: boolean = false,
) => (
  WrappedComponent: React.ComponentType<Props>,
): React.FC<Omit<Props, keyof WithUserSettingsCompatibilityProps<T>>> => (props: Props) => {
  const [state, setState, loaded] = useUserSettingsCompatibility(
    configStorageKey,
    localStoragekey,
    defaultvalue,
    sync,
  );
  return loaded ? (
    <WrappedComponent {...props} userSettingState={state} setUserSettingState={setState} />
  ) : null;
};
