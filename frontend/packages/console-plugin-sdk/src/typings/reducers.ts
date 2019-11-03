import { Reducer } from 'redux';
import { Extension } from './extension';

namespace ExtensionProperties {
  export interface ReduxReducer {
    /** The key to represent reducer-managed substate within the Redux state object. */
    namespace: string;
    /** The reducer function, operating on reducer-managed substate. */
    reducer: Reducer;
    /** Feature flags required for this extension to be effective. */
    required?: string | string[];
  }
}

export interface ReduxReducer extends Extension<ExtensionProperties.ReduxReducer> {
  type: 'ReduxReducer';
}

export const isReduxReducer = (e: Extension): e is ReduxReducer => {
  return e.type === 'ReduxReducer';
};
