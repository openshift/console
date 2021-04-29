import { vmWizardActions } from '../../../../redux/actions';
import { ActionType } from '../../../../redux/types';
import { CloudInitField, VMWizardStorage } from '../../../../types';

export const cloudInitActions = {
  updateStorage: (storage: VMWizardStorage, wizardReduxID: string) =>
    vmWizardActions[ActionType.UpdateStorage](wizardReduxID, storage),
  removeStorage: (storageId: string, wizardReduxID: string) =>
    vmWizardActions[ActionType.RemoveStorage](wizardReduxID, storageId),
  setIsForm: (isForm: boolean, wizardReduxID: string, dispatch) =>
    dispatch(
      vmWizardActions[ActionType.SetCloudInitFieldValue](
        wizardReduxID,
        CloudInitField.IS_FORM,
        isForm,
      ),
    ),
  setAuthKeys: (authKeys: string[], wizardReduxID: string) =>
    vmWizardActions[ActionType.SetCloudInitFieldValue](
      wizardReduxID,
      CloudInitField.AUTH_KEYS,
      authKeys,
    ),
};
