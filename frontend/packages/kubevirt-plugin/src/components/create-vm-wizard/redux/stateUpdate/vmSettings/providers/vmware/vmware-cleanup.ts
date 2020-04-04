import { InternalActionType, UpdateOptions } from '../../../../types';
import {
  iGetVMWareField,
  isVMWareProvider,
} from '../../../../../selectors/immutable/provider/vmware/selectors';
import { VMImportProvider, VMWareProviderField, VMWizardProps } from '../../../../../types';
import { iGetCommonData } from '../../../../../selectors/immutable/selectors';
import { vmWizardInternalActions } from '../../../../internal-actions';
import { deleteV2VvmwareObject } from '../../../../../../../k8s/requests/v2v/delete-v2vvmware-object';
import { getVmWareInitialState } from '../../../../initial-state/providers/vmware-initial-state';

// should be idempotent and called on every provider change
export const cleanupVmWareProvider = async (options: UpdateOptions) => {
  const { id, prevState, getState, dispatch } = options;
  const state = getState();

  const name = iGetVMWareField(state, id, VMWareProviderField.V2V_NAME);
  if (name) {
    // delete stale object
    deleteV2VvmwareObject({
      name,
      namespace: iGetCommonData(state, id, VMWizardProps.activeNamespace),
    });
  }

  // will clear V2V_NAME if provider changed
  if (isVMWareProvider(prevState, id) && !isVMWareProvider(state, id)) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetImportProvider](
        id,
        VMImportProvider.VMWARE,
        getVmWareInitialState(),
      ),
    );
  }
};
