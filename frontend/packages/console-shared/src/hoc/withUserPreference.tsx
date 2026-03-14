import type { ComponentType, FC } from 'react';
import { useUserPreference } from '../hooks/useUserPreference';

export type WithUserPreferenceProps<T> = {
  userSettingState: T;
  setUserSettingState: (v: T) => void;
};

/** @deprecated Use {@link useUserPreference} hook. */
export const withUserPreference = <Props extends WithUserPreferenceProps<T>, T = string>(
  configStorageKey: string,
  defaultValue?: T,
) => (
  WrappedComponent: ComponentType<Props>,
): FC<Omit<Props, keyof WithUserPreferenceProps<T>>> => {
  const Component = (props: Props) => {
    const [state, setState, loaded] = useUserPreference(configStorageKey, defaultValue);
    return loaded ? (
      <WrappedComponent {...props} userSettingState={state} setUserSettingState={setState} />
    ) : null;
  };
  Component.displayName = `withUserPreference(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;
  return Component;
};
