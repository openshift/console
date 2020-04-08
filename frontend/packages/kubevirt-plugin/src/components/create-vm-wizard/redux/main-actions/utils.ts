import { ChangedCommonDataProp } from '../../types';
import { updateAndValidateState } from '../utils';

export const withUpdateAndValidateState = (
  id: string,
  resolveAction,
  changedCommonData?: Set<ChangedCommonDataProp>,
) => (dispatch, getState) => {
  const prevState = getState(); // must be called before dispatch in resolveAction

  resolveAction(dispatch, getState);

  updateAndValidateState({
    id,
    dispatch,
    changedCommonData: changedCommonData || new Set<ChangedCommonDataProp>(),
    getState,
    prevState,
  });
};
