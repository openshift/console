import { InternalActionType, UpdateOptions } from '../../../types';
import { OvirtProviderField, VMImportProvider, VMWizardProps } from '../../../../types';
import {
  iGetOvirtField,
  isOvirtProvider,
} from '../../../../selectors/immutable/provider/ovirt/selectors';
import { deleteOvirtProviderObject } from '../../../../../../k8s/requests/v2v/delete-ovrt-provider-object';
import { iGetCommonData } from '../../../../selectors/immutable/selectors';
import { vmWizardInternalActions } from '../../../internal-actions';
import { getOvirtInitialState } from '../../../initial-state/providers/ovirt-initial-state';

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
