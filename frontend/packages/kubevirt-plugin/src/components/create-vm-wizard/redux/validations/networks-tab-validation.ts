import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { iGetIn } from '../../../../utils/immutable';
import { validateNIC } from '../../../../utils/validations/vm';
import { hasNetworksChanged, iGetNetworks } from '../../selectors/immutable/networks';
import { checkTabValidityChanged } from '../../selectors/immutable/selectors';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { getNetworks } from '../../selectors/selectors';
import { VMWizardTab } from '../../types';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions } from '../types';

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
  let errorKey: string;

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
      // t('kubevirt-plugin~Please select the boot source.')
      errorKey = 'kubevirt-plugin~Please select the boot source.';
      hasAllRequiredFilled = false;
    }
  }

  let isValid = hasAllRequiredFilled;

  if (isValid) {
    isValid = iNetworks.every((iNetwork) => iGetIn(iNetwork, ['validation', 'isValid']));
  }

  if (
    checkTabValidityChanged(
      state,
      id,
      VMWizardTab.NETWORKING,
      isValid,
      hasAllRequiredFilled,
      errorKey,
      null,
    )
  ) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetTabValidity](
        id,
        VMWizardTab.NETWORKING,
        isValid,
        hasAllRequiredFilled,
        errorKey,
      ),
    );
  }
};
