import { deleteOvirtProviderObject } from '../../../../../../k8s/requests/v2v/delete-ovrt-provider-object';
import {
  iGetOvirtField,
  isOvirtProvider,
} from '../../../../selectors/immutable/provider/ovirt/selectors';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import { OvirtProviderField, VMImportProvider, VMWizardProps } from '../../../../types';
import { getOvirtInitialState } from '../../../initial-state/providers/ovirt-initial-state';
import { vmWizardInternalActions } from '../../../internal-actions';
import { InternalActionType, UpdateOptions } from '../../../types';

// should be idempotent and called on every provider change
export const cleanupOvirtProvider = async (options: UpdateOptions) => {
  const { id, prevState, getState, dispatch } = options;
  const state = getState();

  const name = iGetOvirtField(state, id, OvirtProviderField.CURRENT_OVIRT_PROVIDER_CR_NAME);
  if (name) {
    // delete stale object
    deleteOvirtProviderObject({
      name,
      namespace: iGetCommonData(state, id, VMWizardProps.activeNamespace),
    });
  }

  // will clear ACTIVE_OVIRT_PROVIDER_CR_NAME if provider changed
  if (isOvirtProvider(prevState, id) && !isOvirtProvider(state, id)) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetImportProvider](
        id,
        VMImportProvider.OVIRT,
        getOvirtInitialState(),
      ),
    );
  }
};
