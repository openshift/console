import { InternalActionType } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import { ChangedCommonDataProp } from '../../types';
import { getProviders } from '../../provider-definitions';

export const disposeWizard = (id: string) => (dispatch, getState) => {
  const prevState = getState(); // must be called before dispatch

  const options = {
    id,
    changedCommonData: new Set<ChangedCommonDataProp>(),
    dispatch,
    prevState,
    getState,
  };

  getProviders().forEach((provider) => provider.cleanup(options));

  dispatch(vmWizardInternalActions[InternalActionType.Dispose](id));
};
