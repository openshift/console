import { v2vConfigMapActionsNames } from '../actions/v2v-config-map-actions';

const initialState = {};

const v2vConfigMapReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case v2vConfigMapActionsNames.updateImages:
      return { ...state, ...payload };
    default:
      return state;
  }
};

export default v2vConfigMapReducer;
