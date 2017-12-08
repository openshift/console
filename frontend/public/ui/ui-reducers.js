import * as _ from 'lodash';
import * as Immutable from 'immutable';

import { types } from './ui-actions';

export default (state, action) => {
  if (!state) {
    return Immutable.Map({
      activeNavSectionId: 'workloads',
    });
  }

  switch (action.type) {
    case types.setActiveNamespace:
      return state.set('activeNamespace', action.value);

    case types.setCurrentLocation:
      return state.set('activeNamespace', action.ns)
        .set('location', action.location);

    case types.startImpersonate:
      return state.set('impersonate', {kind: action.kind, name: action.name});

    case types.stopImpersonate:
      return state.delete('impersonate');

    case types.sortList:
      return state.mergeIn(['listSorts', action.listId], _.pick(action, ['field', 'func', 'orderBy']));

    default:
      break;
  }
  return state;
};
