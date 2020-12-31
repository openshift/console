import { CloudInitField, VMWizardTab } from '../../types';
import { InternalActionType, UpdateOptions } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import { checkTabValidityChanged } from '../../selectors/immutable/selectors';
import { iGetCloudInitValue } from '../../selectors/immutable/cloud-init';

const validAuthKey = (authKey: string): boolean => {
  return /^ssh-rsa AAAA[0-9A-Za-z+/]+[=]{0,3}([ ][^@ ]+@[^@ ]+)?$/.test(authKey);
};
export const getAuthKeyError = (isForm: boolean, authKeys: string[]): boolean =>
  isForm && !!authKeys.find((authkey) => authkey && !validAuthKey(authkey));

export const setAdvancedTabValidity = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();

  const isForm = iGetCloudInitValue(state, id, CloudInitField.IS_FORM);
  const authKeys = iGetCloudInitValue(state, id, CloudInitField.AUTH_KEYS);
  const isValid = !getAuthKeyError(isForm, authKeys);

  // t('kubevirt-plugin~Invalid SSH public key format in Cloud Init settings (use rfc4253 ssh-rsa format).')
  const errorKey =
    !isValid &&
    'kubevirt-plugin~Invalid SSH public key format in Cloud Init settings (use rfc4253 ssh-rsa format).';

  if (
    checkTabValidityChanged(
      state,
      id,
      VMWizardTab.ADVANCED_CLOUD_INIT,
      isValid,
      isValid, // hasAllRequiredFilled
      errorKey,
      null,
    )
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.ADVANCED_CLOUD_INIT,
        isValid,
        isValid, // hasAllRequiredFilled
        errorKey,
      ),
    );
  }
};
