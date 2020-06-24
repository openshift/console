import { Provider } from 'react';
import { Extension } from './base';

namespace ExtensionProperties {
  export interface ContextProvider<T> {
    /** Context Provider Exotic Component. */
    Provider: Provider<T>;
    /** Hook for the Context value. */
    useValueHook: () => T;
  }
}

export interface ContextProvider<R = any>
  extends Extension<ExtensionProperties.ContextProvider<R>> {
  type: 'ContextProvider';
}

export const isContextProvider = (e: Extension): e is ContextProvider => {
  return e.type === 'ContextProvider';
};
