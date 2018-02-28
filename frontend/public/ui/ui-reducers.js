import * as _ from 'lodash';
import * as Immutable from 'immutable';

import { types } from './ui-actions';
import { ALL_NAMESPACES_KEY, NAMESPACE_LOCAL_STORAGE_KEY } from '../const';
import { legalNamePattern } from '../components/utils/link';

const parsedFavorite = localStorage.getItem(NAMESPACE_LOCAL_STORAGE_KEY);
let activeNamespace = 'default';
if (_.isString(parsedFavorite)) {
  if (parsedFavorite.match(legalNamePattern) || parsedFavorite === ALL_NAMESPACES_KEY) {
    activeNamespace = parsedFavorite;
  }
}

export default (state, action) => {
  if (!state) {
    return Immutable.Map({
      activeNavSectionId: 'workloads',
      activeNamespace,
    });
  }

  switch (action.type) {
    case types.setActiveNamespace:
      if (!action.value) {
        // eslint-disable-next-line no-console
        console.warn('setActiveNamespace: Not setting to falsy!');
        return state;
      }
      return state.set('activeNamespace', action.value);

    case types.setCurrentLocation:
      state = state.set('location', action.location);
      if (_.isUndefined(action.ns)) {
        return state;
      }
      return state.set('activeNamespace', action.ns);

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
