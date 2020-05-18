import * as React from 'react';
import { connect } from 'react-redux';
import {
  Bullseye,
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateVariant,
  Split,
  SplitItem,
  Title,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import {
  hasStepCreateDisabled,
  hasStepDeleteDisabled,
  hasStepUpdateDisabled,
  isStepLocked,
} from '../../selectors/immutable/wizard-selectors';
import { VMWizardNetwork, VMWizardTab } from '../../types';
import { VMNicsTable } from '../../../vm-nics/vm-nics';
import { nicTableColumnClasses } from '../../../vm-nics/utils';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { getNetworks } from '../../selectors/selectors';
import { wrapWithProgress } from '../../../../utils/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { DeviceType } from '../../../../constants/vm';
import { vmWizardNicModalEnhanced } from './vm-wizard-nic-modal-enhanced';
import { VMWizardNicRow } from './vm-wizard-nic-row';
import { VMWizardNetworkBundle } from './types';
import { NetworkBootSource } from './network-boot-source';
import { ADD_NETWORK_INTERFACE } from '../../../../utils/strings';
import { NetworkWrapper } from '../../../../k8s/wrapper/vm/network-wrapper';
import { NetworkInterfaceWrapper } from '../../../../k8s/wrapper/vm/network-interface-wrapper';

import './networking-tab.scss';

const getNicsData = (networks: VMWizardNetwork[]): VMWizardNetworkBundle[] =>
  networks.map((wizardNetworkData) => {
    const { networkInterface, network } = wizardNetworkData;
    const networkInterfaceWrapper = new NetworkInterfaceWrapper(networkInterface);
    return {
      wizardNetworkData,
      // for sorting
      name: networkInterfaceWrapper.getName(),
      model: networkInterfaceWrapper.getReadableModel(),
      networkName: new NetworkWrapper(network).getReadableName(),
      interfaceType: networkInterfaceWrapper.getTypeValue(),
      macAddress: networkInterfaceWrapper.getMACAddress(),
    };
  });

const NetworkingTabComponent: React.FC<NetworkingTabComponentProps> = ({
  isBootNICRequired,
  wizardReduxID,
  isLocked,
  setTabLocked,
  removeNIC,
  onBootOrderChanged,
  networks,
  isCreateDisabled,
  isUpdateDisabled,
  isDeleteDisabled,
}) => {
  const showNetworks = networks.length > 0 || isBootNICRequired;

  const withProgress = wrapWithProgress(setTabLocked);

  const addButtonProps = {
    id: 'add-nic',
    onClick: () =>
      withProgress(
        vmWizardNicModalEnhanced({
          blocking: true,
          wizardReduxID,
        }).result,
      ),
    isDisabled: isLocked || isCreateDisabled,
  };

  return (
    <div className="co-m-pane__body co-m-pane__form kubevirt-create-vm-modal__networking-tab-container">
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h5" size="lg">
            Network Interfaces
          </Title>
        </SplitItem>
        {showNetworks && (
          <SplitItem>
            <Button {...addButtonProps} variant={ButtonVariant.secondary}>
              {ADD_NETWORK_INTERFACE}
            </Button>
          </SplitItem>
        )}
      </Split>
      {showNetworks && (
        <>
          <VMNicsTable
            columnClasses={nicTableColumnClasses}
            data={getNicsData(networks)}
            customData={{
              isDisabled: isLocked,
              isDeleteDisabled,
              isUpdateDisabled,
              withProgress,
              removeNIC,
              wizardReduxID,
            }}
            row={VMWizardNicRow}
          />
          {isBootNICRequired && (
            <NetworkBootSource
              className="kubevirt-create-vm-modal__networking-tab-pxe"
              isDisabled={isLocked}
              networks={networks}
              onBootOrderChanged={onBootOrderChanged}
            />
          )}
        </>
      )}
      {!showNetworks && (
        <Bullseye>
          <EmptyState variant={EmptyStateVariant.full}>
            <Title headingLevel="h5" size="lg">
              No network interface added
            </Title>
            <Button {...addButtonProps} icon={<PlusCircleIcon />} variant={ButtonVariant.link}>
              {ADD_NETWORK_INTERFACE}
            </Button>
          </EmptyState>
        </Bullseye>
      )}
    </div>
  );
};

type NetworkingTabComponentProps = {
  isLocked: boolean;
  isCreateDisabled: boolean;
  isUpdateDisabled: boolean;
  isDeleteDisabled: boolean;
  isBootNICRequired: boolean;
  wizardReduxID: string;
  networks: VMWizardNetwork[];
  removeNIC: (id: string) => void;
  setTabLocked: (isLocked: boolean) => void;
  onBootOrderChanged: (deviceID: string, bootOrder: number) => void;
};

const stateToProps = (state, { wizardReduxID }) => ({
  isLocked: isStepLocked(state, wizardReduxID, VMWizardTab.NETWORKING),
  isCreateDisabled: hasStepCreateDisabled(state, wizardReduxID, VMWizardTab.NETWORKING),
  isUpdateDisabled: hasStepUpdateDisabled(state, wizardReduxID, VMWizardTab.NETWORKING),
  isDeleteDisabled: hasStepDeleteDisabled(state, wizardReduxID, VMWizardTab.NETWORKING),
  networks: getNetworks(state, wizardReduxID),
  isBootNICRequired: iGetProvisionSource(state, wizardReduxID) === ProvisionSource.PXE,
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  setTabLocked: (isLocked) => {
    dispatch(
      vmWizardActions[ActionType.SetTabLocked](wizardReduxID, VMWizardTab.NETWORKING, isLocked),
    );
  },
  removeNIC: (id: string) => {
    dispatch(vmWizardActions[ActionType.RemoveNIC](wizardReduxID, id));
  },
  onBootOrderChanged: (deviceID: string, bootOrder: number) => {
    dispatch(
      vmWizardActions[ActionType.SetDeviceBootOrder](
        wizardReduxID,
        deviceID,
        DeviceType.NIC,
        bootOrder,
      ),
    );
  },
});

export const NetworkingTab = connect(stateToProps, dispatchToProps)(NetworkingTabComponent);
