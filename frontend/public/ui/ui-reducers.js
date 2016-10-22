import Immutable from 'immutable';

import {types} from './ui-actions';

export default (state, action)  => {
  if (!state) {
    return Immutable.Map();
  }

  switch (action.type) {
    case types.setActiveNamespace:
      return state.set('activeNamespace', action.value);
    default:
      break;
  }
  return state;
};
