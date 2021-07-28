import {
  AUTOUNATTEND,
  SysprepData,
  UNATTEND,
} from '../../components/create-vm-wizard/tabs/advanced-tab/sysprep/utils/sysprep-utils';
import { SysprepActionsNames } from '../actions/sysprep-actions';

const initialState: SysprepData = { [UNATTEND]: null, [AUTOUNATTEND]: null };

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
