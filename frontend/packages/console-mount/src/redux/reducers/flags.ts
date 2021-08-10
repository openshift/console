import { Map as ImmutableMap } from 'immutable';

export type FLAGS = ImmutableMap<string, boolean>;

/**
 * TODO: Use the regular flags reducer
 */
const flags = (state: FLAGS, action): FLAGS => {
  if (!state) {
    return ImmutableMap({});
  }

  switch (action.type) {
    case 'setFlag':
      return state.set(action.payload.flag, action.payload.value);
    default:
      return state;
  }
};

export default flags;
