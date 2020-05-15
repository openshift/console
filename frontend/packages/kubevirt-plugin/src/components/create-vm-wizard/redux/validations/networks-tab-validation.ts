import { VMWizardTab } from '../../types';
import { InternalActionType, UpdateOptions } from '../types';
import { vmWizardInternalActions } from '../internal-actions';
import { validateNIC } from '../../../../utils/validations/vm';
import { iGetIn } from '../../../../utils/immutable';
import { hasNetworksChanged, iGetNetworks } from '../../selectors/immutable/networks';
import { checkTabValidityChanged } from '../../selectors/immutable/selectors';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { getNetworks } from '../../selectors/selectors';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';

export const validateNetworks = (options: UpdateOptions) => {
  const { id, prevState, dispatch, getState } = options;
  const state = getState();

  if (!hasNetworksChanged(prevState, state, id)) {
    return;
  }

  const networks = getNetworks(state, id).map((networkBundle) => ({
    ...networkBundle,
    networkInterfaceWrapper: new NetworkInterfaceWrapper(networkBundle.networkInterface),
    networkWrapper: new NetworkWrapper(networkBundle.network),
  }));

  const validatedNetworks = networks.map(
    ({ networkInterfaceWrapper, networkWrapper, ...networkBundle }) => {
      const otherNetworkBundles = networks.filter((n) => n.id !== networkBundle.id); // to discard networks with a same name
      const usedInterfacesNames = new Set(
        otherNetworkBundles.map(({ networkInterfaceWrapper: niw }) => niw.getName()),
      );

      return {
        ...networkBundle,
        validation: validateNIC(networkInterfaceWrapper, networkWrapper, { usedInterfacesNames }),
      };
    },
  );

  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, validatedNetworks));
};

export const setNetworksTabValidity = (options: UpdateOptions) => {
  const { id, dispatch, getState } = options;
  const state = getState();
  const iNetworks = iGetNetworks(state, id);
  let error = null;

  let hasAllRequiredFilled = iNetworks.every((iNetwork) =>
    iGetIn(iNetwork, ['validation', 'hasAllRequiredFilled']),
  );

  if (iGetProvisionSource(state, id) === ProvisionSource.PXE) {
    const hasBootSource = !!iNetworks.find(
      (networkBundle) =>
        !iGetIn(networkBundle, ['network', 'pod']) &&
        iGetIn(networkBundle, ['networkInterface', 'bootOrder']) === 1,
    );
    if (!hasBootSource) {
      error = 'Please select the boot source.';
      hasAllRequiredFilled = false;
    }
  }

  let isValid = hasAllRequiredFilled;

  if (isValid) {
    isValid = iNetworks.every((iNetwork) => iGetIn(iNetwork, ['validation', 'isValid']));
  }

  if (
    checkTabValidityChanged(state, id, VMWizardTab.NETWORKING, isValid, hasAllRequiredFilled, error)
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.NETWORKING,
        isValid,
        hasAllRequiredFilled,
        error,
      ),
    );
  }
};
