import {connect} from 'react-redux';
import * as Immutable from 'immutable';

import { k8sKinds } from './module/k8s';

// import { k8sBasePath } from './module/k8s';
// import { coFetchJSON } from './co-fetch';

export const kindReducerName = 'KINDS';
export const kindReducer = (state, action) => {
  if (!state) {
    return Immutable.fromJS(k8sKinds);
  }

  // if (action.type === SET_FLAGS) {
  //   _.each(action.flags, (v, k) => {
  //     if (!FLAGS[k]) {
  //       throw new Error(`unknown key for reducer ${k}`);
  //     }
  //   });
  //   return state.merge(action.flags);
  // }
  return state;
};

export const stateToProps = (state, {kind}) => {
  return {kindObj: state.UI.getIn([kindReducerName, kind]).toJSON()};
};

export const mergeProps = (stateProps, dispatchProps, ownProps) => Object.assign({}, ownProps, stateProps, dispatchProps);

export const areStatesEqual = (next, previous) => next.FLAGS.equals(previous.FLAGS) &&
  next.UI.get('activeNamespace') === previous.UI.get('activeNamespace') &&
  next.UI.get('location') === previous.UI.get('location');

export const connectToKinds = props => connect(stateToProps);
