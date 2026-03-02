import type { ComponentType, FC } from 'react';
import { useUserPreferenceCompatibility } from '../hooks';

export type WithUserPreferenceCompatibilityProps<T> = {
  userSettingState: T;
  setUserSettingState: (v: T) => void;
};

/** @deprecated Use {@link useUserPreferenceCompatibility} hook. */
export const withUserPreferenceCompatibility = <
  Props extends WithUserPreferenceCompatibilityProps<T>,
  T = string
>(
  configStorageKey: string,
  localStoragekey: string,
  defaultValue?: T,
  sync: boolean = false,
) => (
  WrappedComponent: ComponentType<Props>,
): FC<Omit<Props, keyof WithUserPreferenceCompatibilityProps<T>>> => {
  const Component = (props: Props) => {
    const [state, setState, loaded] = useUserPreferenceCompatibility(
      configStorageKey,
      localStoragekey,
      defaultValue,
      sync,
    );
    return loaded ? (
      <WrappedComponent {...props} userSettingState={state} setUserSettingState={setState} />
    ) : null;
  };
  Component.displayName = `withUserPreferenceCompatibility(${
    WrappedComponent.displayName || WrappedComponent.name
  })`;
  return Component;
};
