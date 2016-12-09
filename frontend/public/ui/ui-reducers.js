import Immutable from 'immutable';

import {types} from './ui-actions';

export default (state, action)  => {
  if (!state) {
    return Immutable.Map();
  }

  switch (action.type) {
    case types.initActiveNamespace:
      return state.get('isActiveNamespaceSet') === true
        ? state
        : state.set('activeNamespace', action.value).set('isActiveNamespaceSet', true);
    case types.setActiveNamespace:
      return state.set('activeNamespace', action.value).set('isActiveNamespaceSet', true);
    default:
      break;
  }
  return state;
};
