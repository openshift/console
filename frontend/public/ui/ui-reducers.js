import Immutable from 'immutable';

import {types} from './ui-actions';

export default (state, action) => {
  if (!state) {
    return Immutable.Map({
      activeNavSectionId: 'workloads',
    });
  }

  switch (action.type) {
    case types.setActiveNamespace:
      return state.set('activeNamespace', action.value).set('isActiveNamespaceSet', true);

    case types.setCurrentLocation:
      if (state.get('isActiveNamespaceSet') !== true) {
        state = state.set('activeNamespace', action.ns).set('isActiveNamespaceSet', true);
      }
      return state.set('location', action.location);

    case types.setActiveNavSectionId:
      return state.set('activeNavSectionId', action.value);

    case types.sortList:
      return state.mergeIn(['listSorts', action.listId], _.pick(action, ['field', 'func', 'order']));

    default:
      break;
  }
  return state;
};
