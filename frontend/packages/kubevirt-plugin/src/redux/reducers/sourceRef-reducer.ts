import { SourceRefActionsNames } from '../actions/sourceRef-actions';

const initialState = { value: null };

const sourceRefReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case SourceRefActionsNames.updateValue:
      return { ...state, value: payload };
    case SourceRefActionsNames.clearValues:
      return { ...initialState };
    default:
      return state;
  }
};

export default sourceRefReducer;
