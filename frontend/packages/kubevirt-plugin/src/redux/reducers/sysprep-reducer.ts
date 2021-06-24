import { SysprepActionsNames } from '../actions/sysprep-actions';

type SysprepInitialState = {
  unattended: string | null;
  autoUnattended: string | null;
};

const initialState: SysprepInitialState = { unattended: null, autoUnattended: null };

const sysprepReducer = (state = initialState, { type, payload }) => {
  switch (type) {
    case SysprepActionsNames.updateValue:
      return { ...state, ...payload };
    case SysprepActionsNames.clearValues:
      return { ...initialState };
    default:
      return state;
  }
};

export default sysprepReducer;
